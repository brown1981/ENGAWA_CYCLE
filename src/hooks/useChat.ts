"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatMessage, ChatSession } from "@/lib/types";
import { useChatContext } from "@/contexts/ChatContext";

export function useChat() {
  const { 
    sessions, currentSessionId, updateSession, upsertSession,
    createSession: contextCreateSession, apiKey, setApiKey: contextSetApiKey,
    model, setModel: contextSetModel, settings
  } = useChatContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStatus(null);
  }, []);

  const clearMessages = useCallback(() => {
    if (currentSessionId) updateSession(currentSessionId, { messages: [] });
  }, [currentSessionId, updateSession]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const sendMessage = useCallback(async (content: string, image?: string | null) => {
    if (!content.trim() && !image) return;
    if (isLoading) return;

    setIsLoading(true);
    setStatus("Initiating executive protocol...");
    setError(null);

    let targetSession = currentSession;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: image ? `${image}\n\n${content}` : content,
      createdAt: new Date().toISOString(),
    };

    let payloadMessages: ChatMessage[] = [];

    if (!targetSession) {
      targetSession = {
        id: crypto.randomUUID(),
        title: content.slice(0, 20) || "Image Analysis",
        provider: model.includes("claude") ? "anthropic" : model.includes("gemini") ? "google" : "openai",
        model,
        messages: [userMessage],
        updatedAt: new Date().toISOString(),
      };
      upsertSession(targetSession);
      payloadMessages = [userMessage];
    } else {
      payloadMessages = [...targetSession.messages, userMessage];
      updateSession(targetSession.id, { messages: payloadMessages });
    }

    if (!apiKey) {
      const authErrorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ **認証エラー**: AIの知能（APIキー）が設定されていません。[OS Preferences] からAPIキーを正しく入力してください。",
        createdAt: new Date().toISOString(),
      };
      updateSession(targetSession!.id, (prev) => ({ messages: [...prev.messages, authErrorMessage] }));
      setIsLoading(false);
      setStatus(null);
      return;
    }

    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          ...(settings.anthropicKey ? { "X-Anthropic-Key": settings.anthropicKey } : {}),
          ...(settings.geminiKey ? { "X-Gemini-Key": settings.geminiKey } : {}),
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model: model,
          image: image,
          searchKey: settings.searchKey,
          customInstructions: settings.customInstructions
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`[${response.status}] ${errorData.error || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.type === "status") {
              setStatus(chunk.content);
            } else if (chunk.type === "final") {
              const assistantMessage: ChatMessage = {
                id: chunk.id || crypto.randomUUID(),
                role: "assistant",
                content: chunk.content || "",
                createdAt: chunk.createdAt || new Date().toISOString(),
              };
              updateSession(targetSession!.id, (prev) => ({ 
                messages: [...prev.messages, assistantMessage] 
              }));
            } else if (chunk.type === "error") {
              throw new Error(chunk.content);
            }
          } catch (e) {
            console.warn("Failed to parse stream chunk:", e);
          }
        }
      }

      setIsLoading(false);
      setStatus(null);
      abortControllerRef.current = null;

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || "Unknown error occurred");
      setIsLoading(false);
      setStatus(null);
      abortControllerRef.current = null;
      console.error("Chat Error:", err);
    }
  }, [apiKey, currentSession, upsertSession, updateSession, model, settings, isLoading]);

  return {
    messages, sendMessage, stopGeneration, apiKey, setApiKey: contextSetApiKey,
    model, setModel: contextSetModel, clearMessages, isLoading, error, status,
    createSession: contextCreateSession
  };
}
