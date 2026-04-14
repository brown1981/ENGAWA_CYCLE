#!/bin/bash
set -e
echo "🚀 修正プログラムを適用中..."

# 1. 必要なディレクトリの作成
mkdir -p src/lib/providers src/lib/services src/lib/agents src/app/api/chat src/components src/contexts src/hooks

# 2. 全ファイルの書き出し (SOLID & AI Organization & Visual Polish)
cat << 'EOF' > src/lib/types.ts
export type ChatRole = "user" | "assistant" | "system";
export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt: string; };
export type ChatSession = { id: string; title: string; provider: string; model: string; messages: ChatMessage[]; updatedAt: string; };
export type ModelOption = { id: string; name: string; description: string; provider: "openai" | "anthropic" | "google"; };
export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "gpt-4o", name: "Executive (GPT-4o)", description: "High intelligence.", provider: "openai" },
  { id: "claude-3-5-sonnet-latest", name: "Reasoning (Claude)", description: "Logic specialist.", provider: "anthropic" },
  { id: "gemini-1.5-pro-latest", name: "Analysis (Gemini)", description: "Deep analysis.", provider: "google" },
  { id: "gpt-4o-mini", name: "Fast (Mini)", description: "Quick tasks.", provider: "openai" },
];
export type AppTheme = "ink" | "zen" | "aether";
export type AppearanceMode = "light" | "dark" | "auto";
export type AgentProfile = { id: string; name: string; role: string; responsibility: string; instructions: string; model: string; };
export type GlobalSettings = { theme: AppTheme; appearanceMode: AppearanceMode; typingSpeed: number; retentionDays: number; autoSearch: boolean; supabaseUrl?: string; supabaseAnonKey?: string; syncKey?: string; openaiKey?: string; anthropicKey?: string; geminiKey?: string; searchKey?: string; customInstructions?: string; agents?: AgentProfile[]; };
EOF

cat << 'EOF' > src/lib/providers/types.ts
export interface Message { role: "user" | "assistant" | "system" | "tool"; content: string; name?: string; tool_call_id?: string; }
export interface ProviderResponse { id: string; content: string; role: "assistant"; createdAt: string; }
export interface ProviderOptions { model: string; temperature?: number; apiKey: string; systemPrompt?: string; }
export interface AIProvider { name: string; generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse>; }
EOF

cat << 'EOF' > src/lib/providers/factory.ts
import { GeminiProvider } from "./gemini";
import { AnthropicProvider } from "./anthropic";
import { AIProvider } from "./types";
export class ProviderFactory {
  static getProvider(modelName: string): AIProvider {
    if (modelName.startsWith("gemini")) return new GeminiProvider();
    if (modelName.startsWith("claude")) return new AnthropicProvider();
    throw new Error(`Unsupported: ${modelName}`);
  }
}
EOF

cat << 'EOF' > src/lib/providers/gemini.ts
import { AIProvider, Message, ProviderOptions, ProviderResponse } from "./types";
export class GeminiProvider implements AIProvider {
  name = "gemini";
  async generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse> {
    const { model, apiKey, systemPrompt } = options;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
    };
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    return { id: Date.now().toString(), role: "assistant", content: data.candidates[0].content.parts[0].text, createdAt: new Date().toISOString() };
  }
}
EOF

cat << 'EOF' > src/lib/providers/anthropic.ts
import { AIProvider, Message, ProviderOptions, ProviderResponse } from "./types";
export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  async generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse> {
    const { model, apiKey, systemPrompt } = options;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt, messages: messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })) })
    });
    const data = await response.json();
    return { id: data.id, role: "assistant", content: data.content[0].text, createdAt: new Date().toISOString() };
  }
}
EOF

cat << 'EOF' > src/lib/services/taskService.ts
import { supabase } from "@/lib/supabase";
export class TaskService {
  async logTask(log: any) { await supabase.from("tasks").insert([log]); }
  async loadAgentProfile(role: string) {
    const { data } = await supabase.from("agents").select("*").eq("role", role).maybeSingle();
    return data;
  }
}
EOF

cat << 'EOF' > src/lib/agents/executor.ts
import { OpenAI } from "openai";
import { toolSchemas, tools } from "@/lib/tools";
import { TaskService } from "@/lib/services/taskService";

export class AgentExecutor {
  private openai: OpenAI;
  private taskService: TaskService;
  constructor(apiKey: string, private requestId: string, private extraKeys: any = {}, private recursionDepth: number = 0) {
    this.openai = new OpenAI({ apiKey });
    this.taskService = new TaskService();
  }
  async loadAgent(role: string) { return await this.taskService.loadAgentProfile(role); }
  async runV2(messages: any[], model: string, onStatus?: (s: string) => void) {
    let currentMessages = [...messages];
    for (let i = 0; i < 5; i++) {
      if (onStatus) onStatus(`Thinking (Loop ${i+1})...`);
      const response = await this.openai.chat.completions.create({ model, messages: currentMessages, tools: toolSchemas });
      const message = response.choices[0].message;
      if (!message.tool_calls) return { content: message.content || "" };
      currentMessages.push(message);
      for (const t of message.tool_calls) {
        if (onStatus) onStatus(`Using tool: ${t.function.name}...`);
        const result = await (tools as any)[t.function.name](JSON.parse(t.function.arguments), this.extraKeys);
        currentMessages.push({ role: "tool", tool_call_id: t.id, content: JSON.stringify(result) });
      }
    }
    return { content: "Finished" };
  }
}
EOF

cat << 'EOF' > src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { ProviderFactory } from "@/lib/providers/factory";
export const runtime = "edge";
export async function POST(req: Request) {
  const body = await req.json();
  const { messages, model, isAgentic = true } = body;
  const keys = { openai: req.headers.get("Authorization")?.split(" ")[1], anthropic: req.headers.get("X-Anthropic-Key"), gemini: req.headers.get("X-Gemini-Key") };
  
  if (!isAgentic && (model.startsWith("gemini") || model.startsWith("claude"))) {
    const provider = ProviderFactory.getProvider(model);
    const result = await provider.generateResponse(messages, { model, apiKey: model.startsWith("gemini") ? keys.gemini! : keys.anthropic! });
    return NextResponse.json(result);
  }
  const { AgentExecutor } = await import("@/lib/agents/executor");
  const executor = new AgentExecutor(keys.openai!, "req-123", { anthropicKey: keys.anthropic, geminiKey: keys.gemini });
  const manager = await executor.loadAgent("Manager");
  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(d) + "\n"));
      const res = await executor.runV2(messages, model, (s) => send({ type: "status", content: s }));
      send({ type: "final", ...res });
      controller.close();
    }
  });
  return new Response(stream);
}
EOF

cat << 'EOF' > src/app/page.tsx
"use client";
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Settings, Send, BrainCircuit, Users } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { messages, sendMessage, isLoading, status, model, setModel, apiKey } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [input, setInput] = useState("");
  return (
    <main className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col relative">
        <header className="p-6 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
          <h1 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2"><BrainCircuit size={16}/> Engawa Cycle</h1>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-secondary rounded-lg"><Settings size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-card border'}`}>{m.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center animate-pulse py-4">
              <div className="text-[10px] uppercase tracking-widest bg-secondary px-4 py-2 rounded-full border border-accent/20">{status || "Processing..."}</div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="w-full p-4 bg-card border rounded-2xl resize-none pr-16 focus:outline-none focus:ring-1 focus:ring-accent" rows={1} />
            <button onClick={() => { sendMessage(input); setInput(""); }} className="absolute right-4 bottom-3 p-2 bg-accent text-accent-foreground rounded-xl"><Send size={18} /></button>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} model={model} setModel={setModel} />
      </div>
    </main>
  );
}
EOF

cat << 'EOF' > src/components/SettingsModal.tsx
"use client";
import { X, Users, Cloud, Cpu } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { AVAILABLE_MODELS } from "@/lib/types";

export function SettingsModal({ isOpen, onClose, model, setModel }: any) {
  const { settings, updateSettings } = useChatContext();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-card border rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <header className="p-8 border-b flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><Users size={18}/> AI Personnel Management</h2>
          <button onClick={onClose}><X size={20}/></button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           <section className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold uppercase tracking-widest opacity-50">Active Agents</span>
               <button onClick={() => {
                 const n = { id: crypto.randomUUID(), name: "Agent", role: "Specialist", responsibility: "Support", instructions: "Help", model: "gpt-4o-mini" };
                 updateSettings({ agents: [...(settings.agents || []), n] });
               }} className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-lg">RECRUIT</button>
             </div>
             <div className="space-y-4">
               {(settings.agents || []).map((a: any, i: number) => (
                 <div key={a.id} className="p-4 bg-secondary/20 border rounded-xl space-y-3">
                   <div className="flex justify-between font-bold text-sm">
                     <input value={a.name} onChange={e => {
                       const next = [...settings.agents]; next[i].name = e.target.value; updateSettings({ agents: next });
                     }} className="bg-transparent" />
                     <button onClick={() => updateSettings({ agents: settings.agents.filter((x: any) => x.id !== a.id) })}><X size={14}/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <select value={a.model} onChange={e => {
                       const next = [...settings.agents]; next[i].model = e.target.value; updateSettings({ agents: next });
                     }} className="bg-background border rounded p-1">
                       {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                     <input value={a.role} onChange={e => {
                       const next = [...settings.agents]; next[i].role = e.target.value; updateSettings({ agents: next });
                     }} className="bg-background border rounded p-1" />
                   </div>
                 </div>
               ))}
             </div>
           </section>
        </div>
        <footer className="p-8 border-t flex justify-between items-center bg-secondary/10">
          <button onClick={() => alert("Synchronizing to Organization DB...")} className="text-xs font-bold text-accent flex items-center gap-2"><Cloud size={14}/> Sync Personnel</button>
          <button onClick={onClose} className="px-8 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold">AUTHORIZE</button>
        </footer>
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > src/contexts/ChatContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
const ChatContext = createContext<any>(undefined);
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>({ agents: [] });
  useEffect(() => {
    const s = localStorage.getItem("workspace_settings");
    if (s) setSettings(JSON.parse(s));
  }, []);
  const updateSettings = (upd: any) => {
    setSettings((prev: any) => {
      const n = { ...prev, ...upd };
      localStorage.setItem("workspace_settings", JSON.stringify(n));
      return n;
    });
  };
  return <ChatContext.Provider value={{ settings, updateSettings, messages: [], model: "gpt-4o", sessions: [] }}>{children}</ChatContext.Provider>;
}
export const useChatContext = () => useContext(ChatContext);
EOF

chmod +x apply_changes.sh
./apply_changes.sh
echo "✨ すべての修正が完了しました！"
