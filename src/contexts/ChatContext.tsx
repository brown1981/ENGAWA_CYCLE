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
  removeSession: (id: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  settings: GlobalSettings;
  updateSettings: (updates: Partial<GlobalSettings>) => void;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  theme: "pure-black",
  typingSpeed: 20,
  retentionDays: 30,
  autoSearch: true,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<string>("gpt-4o-search-preview");
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const isInitialized = useRef(false);

  const apiKey = settings.openaiKey || "";

  // Helper for remote save - Refactored for Safety (v14)
  const syncToSupabase = useCallback(async (session: ChatSession) => {
    try {
      const supabase = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
      const userId = settings.syncKey;
      if (!supabase || !userId) return;

      // Upsert session
      const { error: sessionError } = await supabase.from('sessions').upsert({
        id: session.id,
        user_id: userId,
        title: session.title,
        model: session.model,
        provider: session.provider,
        updated_at: session.updatedAt
      });

      if (sessionError) throw sessionError;

      // Upsert messages
      if (session.messages.length > 0) {
        const { error: msgError } = await supabase.from('messages').upsert(
          session.messages.map(m => ({
            id: m.id,
            session_id: session.id,
            role: m.role,
            content: m.content,
            created_at: m.createdAt
          }))
        );
        if (msgError) throw msgError;
      }
    } catch (e) {
      // Silent catch to prevent UI freeze
      console.warn("Supabase background sync failed:", e);
    }
  }, [settings.supabaseUrl, settings.supabaseAnonKey, settings.syncKey]);

  // Load state on mount
  useEffect(() => {
    if (isInitialized.current) return;

    const load = async () => {
      const savedSettings = localStorage.getItem("workspace_settings");
      let currentSettings = { ...DEFAULT_SETTINGS };
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        currentSettings = { ...currentSettings, ...parsed };
        setSettings(currentSettings);
      }

      const localData = await getAllSessions();
      let mergedData = localData;

      const supabase = getSupabase(currentSettings.supabaseUrl, currentSettings.supabaseAnonKey);
      if (supabase && currentSettings.syncKey) {
        try {
          const { data: remoteSessions } = await supabase
            .from('sessions')
            .select('*, messages(*)')
            .eq('user_id', currentSettings.syncKey);
          
          if (remoteSessions) {
            const remoteMapped: ChatSession[] = remoteSessions.map(s => ({
              id: s.id,
              title: s.title,
              model: s.model,
              provider: s.provider,
              updatedAt: s.updated_at,
              messages: (s.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.created_at
              })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            }));

            const combined = [...localData];
            remoteMapped.forEach(rs => {
              const idx = combined.findIndex(ls => ls.id === rs.id);
              if (idx === -1) {
                combined.push(rs);
                dbSaveSession(rs);
              } else if (new Date(rs.updatedAt) > new Date(combined[idx].updatedAt)) {
                combined[idx] = rs;
                dbSaveSession(rs);
              }
            });
            mergedData = combined;
          }
        } catch (e) {
          console.error("Supabase sync failed on load:", e);
        }
      }

      const sorted = mergedData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSessions(sorted);
      if (sorted.length > 0) {
        setCurrentSessionId(sorted[0].id);
      }
      isInitialized.current = true;
    };
    load();
  }, []);

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("workspace_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const setApiKey = useCallback((key: string) => {
    updateSettings({ openaiKey: key });
  }, [updateSettings]);

  const createSession = useCallback((title = "New Chat") => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      provider: "openai",
      model,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    // Side effects handled out of state update
    dbSaveSession(newSession);
    syncToSupabase(newSession);
    
    return newSession;
  }, [model, syncToSupabase]);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession> | ((prev: ChatSession) => Partial<ChatSession>)) => {
    setSessions(prev => {
      const target = prev.find(s => s.id === id);
      if (!target) return prev;

      const resolvedUpdates = typeof updates === "function" ? updates(target) : updates;
      const newSession = { ...target, ...resolvedUpdates, updatedAt: new Date().toISOString() };
      
      // Schedule background tasks without blocking UI render
      setTimeout(() => {
        dbSaveSession(newSession);
        syncToSupabase(newSession);
      }, 0);

      const updated = prev.map(s => s.id === id ? newSession : s);
      return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  }, [syncToSupabase]);

  const removeSession = useCallback(async (id: string) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    if (supabase && settings.syncKey) {
      try {
        await supabase.from('sessions').delete().eq('id', id);
      } catch (e) {}
    }
    
    await dbDeleteSession(id);
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        setCurrentSessionId(null);
      }
      return filtered;
    });
  }, [currentSessionId, settings.supabaseUrl, settings.supabaseAnonKey, settings.syncKey]);

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      setCurrentSessionId,
      createSession,
      updateSession,
      removeSession,
      apiKey,
      setApiKey,
      model,
      setModel,
      settings,
      updateSettings
    }}>
      <div className={`theme-root ${settings.theme}`}>
        {children}
      </div>
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within a ChatProvider");
  return context;
}
