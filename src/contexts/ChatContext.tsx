"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ChatSession, ChatMessage, AppTheme, GlobalSettings } from "@/lib/types";
import { getAllSessions, saveSession as dbSaveSession, deleteSession as dbDeleteSession } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  createSession: (title?: string) => ChatSession;
  updateSession: (id: string, updates: Partial<ChatSession> | ((prev: ChatSession) => Partial<ChatSession>)) => void;
  upsertSession: (session: ChatSession) => void;
  removeSession: (id: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  settings: GlobalSettings;
  updateSettings: (updates: Partial<GlobalSettings>) => void;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  theme: "ink",
  appearanceMode: "auto",
  typingSpeed: 20,
  retentionDays: 30,
  autoSearch: true,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Aggressive Key Sanitation (Phase 34)
function sanitizeKey(key: string, name: string): string {
  if (!key) return "";
  let clean = key.trim();
  
  // Only strip if it explicitly looks like a 'npx supabase' command
  if (clean.toLowerCase().startsWith("npx ") || clean.toLowerCase().startsWith("supabase ")) {
    console.warn(`[ChatContext] Detected command prefix in ${name} field. Attempting extraction...`);
    // Try to find the actual key (usually the last long alphanumeric string)
    const segments = clean.split(/\s+/);
    const potentialKey = segments.find(s => s.length > 20 && !s.includes("="));
    return potentialKey || "";
  }
  
  return clean;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<string>("gpt-4o-mini"); // Default to mini for reliability
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const isInitialized = useRef(false);

  const apiKey = settings.openaiKey || "";

  const syncToSupabase = useCallback(async (session: ChatSession) => {
    try {
      const supabase = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
      if (!supabase || !settings.syncKey) return;
      await supabase.from('sessions').upsert({
        id: session.id,
        user_id: settings.syncKey,
        title: session.title,
        model: session.model,
        provider: session.provider,
        updated_at: session.updatedAt
      });
      if (session.messages.length > 0) {
        await supabase.from('messages').upsert(
          session.messages.map(m => ({
            id: m.id,
            session_id: session.id,
            role: m.role,
            content: m.content,
            created_at: m.createdAt
          }))
        ).select("*"); // Trigger execution instead of .catch
      }
    } catch (e) { console.warn("Sync failed:", e); }
  }, [settings.supabaseUrl, settings.supabaseAnonKey, settings.syncKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Cleanup old classes
    root.classList.remove("light", "dark", "pure-black", "paper", "glass", "ink", "zen", "aether");
    
    // Apply Appearance Mode
    if (settings.appearanceMode === "auto") {
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(settings.appearanceMode);
    }
    
    // Apply Stylistic Theme
    root.classList.add(settings.theme);
    root.setAttribute("data-theme", settings.theme);
  }, [settings.theme, settings.appearanceMode]);

  useEffect(() => {
    if (isInitialized.current) return;
    const load = async () => {
      const savedSettings = localStorage.getItem("workspace_settings");
      let currentSettings = { ...DEFAULT_SETTINGS };
      if (savedSettings) {
        try { 
          const parsed = JSON.parse(savedSettings);
          // Migration from old theme names if necessary
          if (parsed.theme === "pure-black") parsed.theme = "ink";
          if (parsed.theme === "paper") parsed.theme = "zen";
          if (parsed.theme === "glass") parsed.theme = "aether";

          currentSettings = { 
            ...currentSettings, 
            ...parsed,
            openaiKey: sanitizeKey(parsed.openaiKey, "OpenAI"),
            anthropicKey: sanitizeKey(parsed.anthropicKey, "Anthropic"),
            geminiKey: sanitizeKey(parsed.geminiKey, "Gemini")
          };
        } catch (e) {}
      }
      setSettings(currentSettings);
      try {
        const localData = await getAllSessions();
        const sorted = localData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSessions(sorted);
        if (sorted.length > 0) setCurrentSessionId(sorted[0].id);
      } catch (e) {}
      isInitialized.current = true;
    };
    load();
  }, []);

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setSettings(prev => {
      const next = { 
        ...prev, 
        ...updates,
        openaiKey: updates.openaiKey !== undefined ? sanitizeKey(updates.openaiKey, "OpenAI") : prev.openaiKey,
        anthropicKey: updates.anthropicKey !== undefined ? sanitizeKey(updates.anthropicKey, "Anthropic") : prev.anthropicKey,
        geminiKey: updates.geminiKey !== undefined ? sanitizeKey(updates.geminiKey, "Gemini") : prev.geminiKey
      };
      localStorage.setItem("workspace_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const setApiKey = useCallback((key: string) => updateSettings({ openaiKey: key }), [updateSettings]);
  
  const setModelInContext = useCallback((newModel: string) => setModel(newModel), []);

  const createSession = useCallback((title = "New Chat") => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      provider: model.includes("claude") ? "anthropic" : model.includes("gemini") ? "google" : "openai",
      model,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    dbSaveSession(newSession);
    syncToSupabase(newSession);
    return newSession;
  }, [model, syncToSupabase]);

  const upsertSession = useCallback((session: ChatSession) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      let next;
      if (idx === -1) {
        next = [session, ...prev];
      } else {
        next = [...prev];
        next[idx] = session;
      }
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    setCurrentSessionId(session.id); // Move out of updater
    dbSaveSession(session);
    syncToSupabase(session);
  }, [syncToSupabase]);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession> | ((prev: ChatSession) => Partial<ChatSession>)) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const resolvedUpdates = typeof updates === "function" ? updates(prev[idx]) : updates;
      const newSession = { ...prev[idx], ...resolvedUpdates, updatedAt: new Date().toISOString() };
      dbSaveSession(newSession);
      syncToSupabase(newSession);
      const next = [...prev];
      next[idx] = newSession;
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  }, [syncToSupabase]);

  const removeSession = useCallback(async (id: string) => {
    await dbDeleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    if (supabase && settings.syncKey) await supabase.from('sessions').delete().eq('id', id);
  }, [currentSessionId, settings.supabaseUrl, settings.supabaseAnonKey, settings.syncKey]);

  return (
    <ChatContext.Provider value={{
      sessions, currentSessionId, setCurrentSessionId, createSession, updateSession, upsertSession,
      removeSession, apiKey, setApiKey, model, setModel: setModelInContext, settings, updateSettings
    }}>
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within a ChatProvider");
  return context;
}
