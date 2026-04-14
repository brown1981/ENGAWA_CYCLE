"use client";

import { X, Key, Palette, Cpu, Cloud, RefreshCw, Copy, Check, BrainCircuit, Sparkles, Moon, Sun, Monitor } from "lucide-react";
import { AVAILABLE_MODELS, AppTheme, AppearanceMode } from "@/lib/types";
import { useChatContext } from "@/contexts/ChatContext";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  model,
  setModel
}: SettingsModalProps) {
  const { settings, updateSettings } = useChatContext();
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const generateSyncKey = () => {
    updateSettings({ syncKey: crypto.randomUUID() });
  };

  const handleCopy = () => {
    if (settings.syncKey) {
      navigator.clipboard.writeText(settings.syncKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-card border border-border/40 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] rounded-[2rem] flex flex-col animate-in zoom-in-95 duration-500"
      >
        <header className="flex justify-between items-center px-10 py-8 border-b border-border/10">
          <div>
            <h2 className="text-xl font-bold tracking-tight">OS Preferences</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30 font-bold font-heading">System Governance</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-secondary rounded-xl liquid-transition opacity-30 hover:opacity-100"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
          
          {/* Section 1: Intellect (AI) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2 font-heading">
              <BrainCircuit size={12} /> Intellect Profile
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Strategy Instructions</span>
                <textarea
                  value={settings.customInstructions || ""}
                  onChange={(e) => updateSettings({ customInstructions: e.target.value })}
                  placeholder="Define the autonomous behavior of your agents..."
                  className="w-full bg-secondary/30 border border-border/20 rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 liquid-transition resize-none min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Selected Engine</span>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-secondary/30 border border-border/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 liquid-transition"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Tactical Fluidity</span>
                    <span className="text-[10px] opacity-40">{settings.typingSpeed}ms</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" value={settings.typingSpeed}
                    onChange={(e) => updateSettings({ typingSpeed: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent my-3"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Connectivity (Records & Sync) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2 font-heading">
              <Cloud size={12} /> Registry & Connectivity
            </h3>
            
            <div className="grid grid-cols-1 gap-5 bg-secondary/15 p-8 rounded-2xl border border-border/10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">OpenAI API Access</span>
                  <input 
                    type="password"
                    value={settings.openaiKey || ""}
                    onChange={(e) => updateSettings({ openaiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-background/50 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent/30 font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Supabase Endpoint</span>
                    <input 
                      type="text"
                      value={settings.supabaseUrl || ""}
                      onChange={(e) => updateSettings({ supabaseUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-background/50 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Database Key</span>
                    <input 
                      type="password"
                      value={settings.supabaseAnonKey || ""}
                      onChange={(e) => updateSettings({ supabaseAnonKey: e.target.value })}
                      placeholder="eyJ..."
                      className="w-full bg-background/50 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Search Intelligence Access</span>
                  <input 
                    type="password"
                    value={settings.searchKey || ""}
                    onChange={(e) => updateSettings({ searchKey: e.target.value })}
                    placeholder="Tavily / Serper Key"
                    className="w-full bg-background/50 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent/30 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Organization-Level Sync Key</span>
                  <div className="relative">
                    <input 
                      type="text"
                      value={settings.syncKey || ""}
                      onChange={(e) => updateSettings({ syncKey: e.target.value })}
                      placeholder="UUID"
                      className="w-full bg-background/50 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none font-mono pr-20"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button onClick={handleCopy} className="p-1.5 opacity-20 hover:opacity-100 hover:bg-secondary rounded-lg liquid-transition">
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                      <button onClick={generateSyncKey} className="p-1.5 opacity-20 hover:opacity-100 hover:bg-secondary rounded-lg liquid-transition">
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Atmosphere (Appearance) */}
          <section className="space-y-8 pb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2 font-heading">
              <Palette size={12} /> Environmental Atmosphere
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Appearance Mode</span>
                <div className="flex p-1 bg-secondary/30 rounded-xl border border-border/10">
                  {(['light', 'dark', 'auto'] as AppearanceMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ appearanceMode: m })}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider liquid-transition
                        ${settings.appearanceMode === m ? "bg-card text-foreground shadow-sm shadow-black/5" : "opacity-30 hover:opacity-100"}
                      `}
                    >
                      {m === 'light' && <Sun size={12} />}
                      {m === 'dark' && <Moon size={12} />}
                      {m === 'auto' && <Monitor size={12} />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Chromatic Scheme</span>
                <div className="flex p-1 bg-secondary/30 rounded-xl border border-border/10">
                  {(['zen', 'ink', 'aether'] as AppTheme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateSettings({ theme: t })}
                      className={`
                        flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest liquid-transition
                        ${settings.theme === t ? "bg-card text-foreground shadow-sm shadow-black/5" : "opacity-30 hover:opacity-100"}
                      `}
                    >
                      <div className={`w-3 h-3 rounded-full mb-0.5 ${t === 'zen' ? 'bg-[#f7f4f0] border border-stone-200' : t === 'ink' ? 'bg-[#18181b] border border-zinc-800' : 'bg-sky-400'}`} />
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="p-8 border-t border-border/10 bg-secondary/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-20">Secure Channel v2.0.1</span>
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-3.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-[0.4em] hover:opacity-90 active:scale-95 shadow-lg liquid-transition transition-all"
          >
            Authorize Changes
          </button>
        </footer>
      </div>
    </div>
  );
}
