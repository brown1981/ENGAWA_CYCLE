"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
const ChatContext = createContext<any>(undefined);
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>({ theme: "ink", appearanceMode: "auto", typingSpeed: 20, retentionDays: 30, autoSearch: true, agents: [] });
  useEffect(() => {
    const s = localStorage.getItem("workspace_settings");
    if (s) try { setSettings(prev => ({ ...prev, ...JSON.parse(s) })); } catch (e) {}
  }, []);
  const updateSettings = useCallback((upd: any) => {
    setSettings((prev: any) => {
      const n = { ...prev, ...upd };
      localStorage.setItem("workspace_settings", JSON.stringify(n));
      return n;
    });
  }, []);
  return <ChatContext.Provider value={{ settings, updateSettings, messages: [], model: "gpt-4o", sessions: [], updateSession: () => {}, upsertSession: () => {}, createSession: () => {} }}>{children}</ChatContext.Provider>;
}
export const useChatContext = () => useContext(ChatContext);
