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
    if (isLoading) return; // Immediate lock

    if (!apiKey) {
      setError("API Key が設定されていません。設定から入力してください。");
      console.warn("[useChat] Attempted to send message without API Key");
      return;
    }

    // Step 0: Initializing state immediately
    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    console.log(`[useChat] Starting sendMessage for model: ${model}`);

    // Phase 32/33: Atomic Preparation
    let targetSession = currentSession;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: image ? `${image}\n\n${content}` : content,
      createdAt: new Date().toISOString(),
    };

    let payloadMessages: ChatMessage[] = [];

    if (!targetSession) {
      console.log("[useChat] Creating new session...");
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
      console.log("[useChat] Adding message to existing session:", targetSession.id);
      payloadMessages = [...targetSession.messages, userMessage];
      updateSession(targetSession.id, { messages: payloadMessages });
    }

    abortControllerRef.current = new AbortController();

    try {
      console.log(`[useChat] Fetching /api/chat... payload size: ${payloadMessages.length}`);
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
          customInstructions: settings.customInstructions
        }),
        signal: abortControllerRef.current.signal
      });

      console.log(`[useChat] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const errorMessage = errorData.error || response.statusText;
        throw new Error(`[${response.status}] ${errorMessage}`);
      }

      const data = await response.json();
      console.log("[useChat] Success! Assistant content received.");

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
        console.warn("[useChat] Received empty content from assistant.");
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
          console.log("[useChat] Typing effect finished.");
        }
      }, settings.typingSpeed || 20);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[useChat] Aborted by user.");
        return;
      }
      console.error("[useChat] Error in sendMessage:", err);
      setError(err.message || "Unknown error occurred");
      setIsLoading(false);
      abortControllerRef.current = null;
      setStreamingContent("");
    }
  }, [apiKey, currentSession, upsertSession, updateSession, model, settings, isLoading]);

  return {
    messages, sendMessage, stopGeneration, apiKey, setApiKey: contextSetApiKey,
    model, setModel: contextSetModel, clearMessages, isLoading, error,
    createSession: contextCreateSession, streamingContent
  };
}
