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
  const [streamingContent, setStreamingContent] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsLoading(false);
    setStreamingContent("");
  }, []);

  const clearMessages = useCallback(() => {
    if (currentSessionId) updateSession(currentSessionId, { messages: [] });
  }, [currentSessionId, updateSession]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const sendMessage = useCallback(async (content: string, image?: string | null) => {
    if (!content.trim() && !image) return;
    if (!apiKey) {
      setError("API Key が設定されていません。設定から入力してください。");
      return;
    }

    // Phase 32: Correct Atomic Preparation
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
      payloadMessages = [userMessage]; // Just the new message for a new session
    } else {
      payloadMessages = [...targetSession.messages, userMessage];
      updateSession(targetSession.id, { messages: payloadMessages });
    }

    setIsLoading(true);
    setError(null);
    setStreamingContent("");
    
    // Debug logging for troubleshooting (Phase 32)
    console.log(`[useChat] Sending ${payloadMessages.length} messages to model: ${model}`);
    
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
          messages: payloadMessages, // Corrected: No more duplication
          model: model,
          image: image,
          customInstructions: settings.customInstructions
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`[${response.status}] ${errorData.error || "Failed to fetch from AI"}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        content: data.content || "",
        createdAt: new Date().toISOString(),
      };

      let i = 0;
      const fullContent = data.content || "";
      if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
      
      if (!fullContent) {
        updateSession(targetSession!.id, (prev) => ({ messages: [...prev.messages, assistantMessage] }));
        setIsLoading(false);
        return;
      }

      typingIntervalRef.current = setInterval(() => {
        if (i < fullContent.length) {
          setStreamingContent(prev => prev + fullContent[i]);
          i++;
        } else {
          if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
          updateSession(targetSession!.id, (prev) => ({ messages: [...prev.messages, assistantMessage] }));
          setStreamingContent("");
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }, settings.typingSpeed || 20);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || "Unknown error occurred");
      setIsLoading(false);
      abortControllerRef.current = null;
      setStreamingContent("");
      console.error("Chat Error:", err);
    }
  }, [apiKey, currentSession, upsertSession, updateSession, model, settings]);

  return {
    messages, sendMessage, stopGeneration, apiKey, setApiKey: contextSetApiKey,
    model, setModel: contextSetModel, clearMessages, isLoading, error,
    createSession: contextCreateSession, streamingContent
  };
}
