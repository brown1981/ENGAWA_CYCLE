"use client";

import { X, Key, Palette, Zap, History, Cpu, Cloud, RefreshCw, Copy, Check, BrainCircuit, Sparkles } from "lucide-react";
import { AVAILABLE_MODELS, AppTheme } from "@/lib/types";
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
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center p-6
        transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
      `}>
        <div className="
          relative w-full max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar
          bg-card/98 backdrop-blur-3xl rounded-[var(--radius)] 
          border border-border/30 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]
          flex flex-col p-12
        ">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1.5">Administrative Core</h2>
              <p className="text-[10px] uppercase tracking-[0.5em] opacity-20 font-bold font-heading">System Parameters</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-secondary rounded-xl liquid-transition active:scale-90 opacity-25 hover:opacity-100"
            >
              <X size={20} />
            </button>
          </header>

          <div className="space-y-12 flex-1">
            {/* AI Personality */}
            <section className="space-y-6">
              <label className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-20 flex items-center gap-2 font-heading">
                <Sparkles size={11} /> Cognitive Directives
              </label>
              <textarea
                value={settings.customInstructions || ""}
                onChange={(e) => updateSettings({ customInstructions: e.target.value })}
                placeholder="Declare high-level objectives..."
                className="w-full bg-secondary/30 border border-border/20 rounded-xl px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/20 liquid-transition resize-none min-h-[100px] leading-relaxed"
              />
            </section>

            {/* AI Profile Section */}
            <section className="space-y-6">
              <label className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-20 flex items-center gap-2 font-heading">
                <BrainCircuit size={11} /> Neural Engine
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-25 ml-1">Selection</span>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-secondary/30 border border-border/20 rounded-xl px-5 py-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent/20 liquid-transition"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-25 ml-1">Fluidity</span>
                  <input 
                    type="range" min="10" max="100" value={settings.typingSpeed}
                    onChange={(e) => updateSettings({ typingSpeed: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent mt-4"
                  />
                </div>
              </div>
            </section>

            {/* Cloud Sync Section */}
            <section className="space-y-6 p-8 bg-secondary/15 rounded-2xl border border-border/10">
              <label className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-20 flex items-center gap-2 font-heading">
                <Cloud size={11} /> Decentralized Records
              </label>
              <div className="space-y-5">
                {[
                  { id: "supabaseUrl", label: "Registry Endpoint", placeholder: "https://xxx.supabase.co" },
                  { id: "supabaseAnonKey", label: "Access Token", placeholder: "eyJ..." }
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-25 ml-1">{field.label}</span>
                    <input 
                      type="password"
                      value={(settings as any)[field.id] || ""}
                      onChange={(e) => updateSettings({ [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-background/40 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent/20 liquid-transition font-mono"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-25 ml-1">Global Artifact Key</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.syncKey || ""}
                      onChange={(e) => updateSettings({ syncKey: e.target.value })}
                      placeholder="Organization UID"
                      className="w-full bg-background/40 border border-border/20 rounded-xl px-5 py-3 text-xs focus:outline-none pr-12 liquid-transition font-mono"
                    />
                    <button onClick={generateSyncKey} className="absolute right-3 top-2 p-1.5 opacity-20 hover:opacity-100">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Theme Section */}
            <section className="space-y-6">
              <label className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-20 flex items-center gap-2 font-heading">
                <Palette size={11} /> Visual Environment
              </label>
              <div className="flex gap-4 p-4 bg-secondary/20 rounded-2xl border border-border/10">
                {(["pure-black", "glass", "paper"] as AppTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateSettings({ theme: t })}
                    className={`
                      flex-1 py-4 rounded-xl border liquid-transition flex flex-col items-center gap-2
                      ${settings.theme === t 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.03] z-10" 
                        : "bg-card border-border/10 opacity-30 hover:opacity-100 hover:scale-[1.01]"}
                    `}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full shadow-inner ${t === 'pure-black' ? 'bg-black' : t === 'glass' ? 'bg-sky-500' : 'bg-[#fdfaf6] border border-border/40'}`} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <footer className="mt-12 pt-8 border-t border-border/20 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] opacity-15">Secure Channel v1.0.5</span>
            </div>
            <button 
              onClick={onClose}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-xl text-[9px] font-bold uppercase tracking-[0.4em] hover:opacity-90 active:scale-95 shadow-lg liquid-transition"
            >
              Authorize
            </button>
          </footer>
        </div>
      </div>
  );
}
