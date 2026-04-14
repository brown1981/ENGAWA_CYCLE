"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage, ChatSession } from "@/lib/types";
import { useChatContext } from "@/contexts/ChatContext";

export function useChat() {
  const { 
    sessions, 
    currentSessionId, 
    updateSession, 
    createSession: contextCreateSession,
    apiKey,
    model,
    setModel,
    settings
  } = useChatContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    if (currentSessionId) {
      updateSession(currentSessionId, { messages: [] });
    }
  }, [currentSessionId, updateSession]);

  const sendMessage = useCallback(async (content: string, image?: string | null) => {
    if (!content.trim() && !image) return;
    if (!apiKey) {
      setError("API Key が設定されていません。設定から入力してください。");
      return;
    }

    let targetSession = currentSession;
    if (!targetSession) {
      targetSession = contextCreateSession(content.slice(0, 20) || "Image Analysis");
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: image ? `${image}\n\n${content}` : content,
      createdAt: new Date().toISOString(),
    };

    // UIを即座に更新
    updateSession(targetSession.id, (prev) => {
      const updatedMessages = [...prev.messages, userMessage];
      return { 
        messages: updatedMessages,
        title: prev.messages.length === 0 ? (content.slice(0, 20) || "Image Analysis") : prev.title
      };
    });

    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    // Initialize AbortController
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
          messages: [...(targetSession?.messages || []), userMessage],
          model: targetSession?.model || model,
          image: image,
          customInstructions: settings.customInstructions
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch from AI");
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        createdAt: new Date().toISOString(),
      };

      // シミュレーション：タイピングエフェクト
      let i = 0;
      const interval = setInterval(() => {
        setStreamingContent(prev => prev + data.content[i]);
        i++;
        if (i >= data.content.length) {
          clearInterval(interval);
          updateSession(targetSession.id, (prev) => ({
            messages: [...prev.messages, assistantMessage]
          }));
          setStreamingContent("");
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }, settings.typingSpeed || 20);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted by user");
        return;
      }
      setError(err.message);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [apiKey, currentSession, contextCreateSession, model, updateSession, settings, stopGeneration]);

  return {
    messages,
    sendMessage,
    stopGeneration,
    apiKey,
    setApiKey: (key: string) => {}, // Managed via context now, but keep hook interface
    model,
    setModel,
    clearMessages,
    isLoading,
    error,
    createSession: contextCreateSession,
    streamingContent
  };
}
