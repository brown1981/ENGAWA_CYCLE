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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div 
        className="w-full max-w-lg bg-card/95 backdrop-blur-3xl rounded-[3rem] p-10 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] border border-border/40 animate-in zoom-in-95 duration-500 liquid-transition"
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight font-heading">OS Preferences</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-secondary rounded-2xl liquid-transition active:scale-90"
          >
            <X size={20} className="opacity-40" />
          </button>
        </div>

        <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar pb-6 text-card-foreground">
          
          {/* Phase 6: AI Personality */}
          <section className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 flex items-center gap-2 font-heading">
              <Sparkles size={12} /> Personality Core
            </label>
            <textarea
              value={settings.customInstructions || ""}
              onChange={(e) => updateSettings({ customInstructions: e.target.value })}
              placeholder="Define high-level strategic constraints..."
              className="w-full bg-secondary/50 border border-border/40 rounded-[1.8rem] px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 liquid-transition resize-none min-h-[120px] leading-[1.7]"
            />
          </section>

          {/* Intelligence Engine */}
          <section className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 flex items-center gap-2 font-heading">
              <Cpu size={12} /> Intelligence Engine
            </label>
            <div className="grid grid-cols-1 gap-3">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`
                    flex flex-col items-start px-6 py-4 rounded-2xl border liquid-transition text-left
                    ${model === m.id 
                      ? "bg-accent/10 border-accent/40 ring-1 ring-accent/20" 
                      : "bg-secondary/40 border-border/20 opacity-60 hover:opacity-100 hover:bg-secondary/60"}
                  `}
                >
                  <div className="flex justify-between w-full items-center mb-1">
                    <span className={`text-sm font-bold tracking-tight ${model === m.id ? "text-accent" : ""}`}>{m.name}</span>
                    <span className="text-[8px] px-2 py-0.5 bg-secondary border border-border/40 rounded-full opacity-60 font-black uppercase tracking-widest">
                      {m.provider}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-40 leading-relaxed">{m.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* API Keys */}
          <section className="space-y-6">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 flex items-center gap-2 font-heading">
              <BrainCircuit size={12} /> Strategic Access Keys
            </label>
            
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {(['openai', 'anthropic', 'gemini'] as const).map((provider) => (
                <div key={provider} className="space-y-2">
                  <div className="flex justify-between px-2">
                    <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{provider}</span>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={settings[`${provider}Key` as keyof typeof settings] as string || ""}
                    onChange={(e) => updateSettings({ [`${provider}Key`]: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full bg-secondary/40 border border-border/40 rounded-[1.2rem] px-6 py-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40 liquid-transition"
                  />
                </div>
              ))}
            </form>
          </section>

          {/* Cloud Sync Section */}
          <section className="space-y-5 p-7 bg-secondary/30 rounded-[2.5rem] border border-dashed border-border/60">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 flex items-center gap-2 font-heading">
              <Cloud size={12} /> Data Synchronization
            </label>
            
            <div className="space-y-4">
              <input
                type="text"
                value={settings.supabaseUrl || ""}
                onChange={(e) => updateSettings({ supabaseUrl: e.target.value })}
                placeholder="Endpoint URL"
                className="w-full bg-card border border-border/40 rounded-2xl px-5 py-4 text-xs focus:outline-none liquid-transition"
              />
              <input
                type="password"
                value={settings.supabaseAnonKey || ""}
                onChange={(e) => updateSettings({ supabaseAnonKey: e.target.value })}
                placeholder="Public Access Key"
                className="w-full bg-card border border-border/40 rounded-2xl px-5 py-4 text-xs focus:outline-none liquid-transition"
                autoComplete="current-password"
              />
              <div className="relative">
                <input
                  type="text"
                  value={settings.syncKey || ""}
                  onChange={(e) => updateSettings({ syncKey: e.target.value })}
                  placeholder="Global Workspace Key"
                  className="w-full bg-card border border-border/40 rounded-2xl px-5 py-4 text-xs focus:outline-none pr-28 liquid-transition"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  {settings.syncKey && (
                    <button onClick={handleCopy} className="p-2 hover:bg-secondary rounded-xl liquid-transition opacity-40">
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  )}
                  <button 
                    onClick={generateSyncKey}
                    className="p-2 hover:bg-secondary rounded-xl liquid-transition opacity-40"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
            </div>
          </section>

          {/* Theme Section */}
          <section className="space-y-6">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2 font-heading">
              <Palette size={12} /> Environmental Aesthetic
            </label>
            <div className="flex gap-4 p-4 bg-secondary/30 rounded-[calc(var(--radius)-0.5rem)] border border-border/40">
              {(["pure-black", "glass", "paper"] as AppTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateSettings({ theme: t })}
                  className={`
                    flex-1 py-4 rounded-xl border liquid-transition flex flex-col items-center gap-2
                    ${settings.theme === t 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02] z-10" 
                      : "bg-card border-border/20 opacity-40 hover:opacity-100 hover:scale-[1.01]"}
                  `}
                >
                  <div className={`w-4 h-4 rounded-full shadow-inner ${t === 'pure-black' ? 'bg-black' : t === 'glass' ? 'bg-sky-500' : 'bg-[#fdfaf6] border border-border/60'}`} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-12 pt-8 border-t border-border/40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30">OS Secure Core v1.0.2</span>
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-xl text-[10px] font-extrabold uppercase tracking-[0.3em] hover:opacity-90 active:scale-95 shadow-lg liquid-transition"
          >
            Authorize Changes
          </button>
        </div>
      </div>
    </div>
  );
}
