"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { Settings, Send, Download, Copy, MessageSquare, Plus, Paperclip, X, Square, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { exportToMarkdown } from "@/lib/export";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { 
    messages, sendMessage, stopGeneration, apiKey, 
    model, setModel, isLoading, error, createSession
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    // Phase 33: Multi-layer protection against race conditions
    if (isLoading) {
      console.log("[Home] Send blocked: Already loading. Stopping generation instead.");
      stopGeneration(); 
      return; 
    }
    if ((!input.trim() && !attachedImage)) return;
    
    console.log("[Home] Triggering sendMessage...");
    sendMessage(input, attachedImage);
    setInput("");
    setAttachedImage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => setInput(prev => prev + `\n\n[FILE: ${file.name}]\n${ev.target?.result}\n`);
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="flex justify-between items-center px-10 py-10 z-10 sticky top-0 bg-background/60 backdrop-blur-3xl border-b border-border/20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 opacity-20 hover:opacity-100 hover:bg-secondary rounded-lg liquid-transition active:scale-95"><MessageSquare size={17} /></button>
          <div className="flex gap-8 items-center">
            {messages.length > 0 && <div className="text-[9px] opacity-20 font-bold uppercase tracking-[0.5em] mr-4 select-none font-heading">{messages.length} Active Records</div>}
            <button onClick={() => createSession()} className="p-2.5 opacity-20 hover:opacity-100 hover:bg-secondary rounded-lg liquid-transition active:scale-95"><Plus size={17} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 opacity-20 hover:opacity-100 hover:bg-secondary rounded-lg liquid-transition active:scale-95"><Settings size={17} /></button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-6 md:px-20 lg:px-40 py-16 space-y-16">
          {error && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500"><AlertCircle size={48} /></div>
              <h2 className="text-lg font-bold">通信エラーが発生しました</h2>
              <p className="text-sm opacity-60 max-w-xs">{error}</p>
              <button onClick={() => setIsSettingsOpen(true)} className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider hover:scale-105 liquid-transition shadow-lg">Settings を確認する</button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 animate-soft-in">
              <BrainCircuit size={48} className="mb-6 stroke-[1]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]">思考を、そのままの形で。</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              return (
                <div key={m.id} className={`group flex flex-col space-y-4 animate-float-in ${m.role === 'user' ? 'items-end' : 'items-start'}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`chat-bubble-p px-6 py-4.5 rounded-[calc(var(--radius)*0.8)] shadow-sm max-w-[88%] liquid-transition ${m.role === 'user' ? 'bg-accent text-accent-foreground rounded-tr-none' : 'bg-card text-card-foreground rounded-tl-none border border-border/40 backdrop-blur-sm'}`}>
                    {m.content.includes("data:image") && (
                       <img src={m.content.match(/data:image\/[^;]+;base64,[^ \n]+/)?.[0]} alt="Attached" className="rounded-lg mb-3.5 max-h-72 object-cover w-full shadow-lg" />
                    )}
                    <div className="whitespace-pre-wrap leading-[1.65] text-sm md:text-[15px]">{m.content.replace(/data:image\/[^;]+;base64,[^ \n]+/, "").trim()}</div>
                  </div>
                  <div className="flex gap-6 px-6 opacity-0 group-hover:opacity-30 liquid-transition">
                    <button onClick={() => navigator.clipboard.writeText(m.content)} className="hover:opacity-100"><Copy size={13} /></button>
                    {m.role === 'assistant' && <button onClick={() => exportToMarkdown(m.content)} className="hover:opacity-100"><Download size={13} /></button>}
                  </div>
                </div>
              );
            })
          )}
          
          {isLoading && (
            <div className="flex items-start animate-soft-in">
              <div className="bg-card px-6 py-3.5 rounded-2xl border border-border/30 pulse-intelligence backdrop-blur-3xl">
                <span className="text-[9px] font-bold tracking-[0.4em] uppercase opacity-25 font-heading">Executing Neural Sequence</span>
              </div>
            </div>
          )}

          {error && messages.length > 0 && (
            <div className="p-6 bg-destructive/10 text-destructive text-xs rounded-[2rem] border border-destructive/20">{error}</div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-10 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <div className="relative group">
              {attachedImage && (
                <div className="absolute -top-24 left-4 p-2 bg-card rounded-2xl border border-border shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                  <div className="relative"><img src={attachedImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl" /><button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"><X size={10} /></button></div>
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={attachedImage ? "Provide context for this visual..." : "Declare strategy..."}
                className="w-full bg-card/80 backdrop-blur-3xl border border-border/30 rounded-2xl px-10 py-6 pr-32 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-1 focus:ring-accent/20 liquid-transition resize-none min-h-[72px] max-h-48 no-scrollbar disabled:opacity-50 text-[15px]"
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-6 bottom-5 flex gap-4">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,image/*" disabled={isLoading} />
                <button onClick={() => fileInputRef.current?.click()} className={`p-3 liquid-transition rounded-xl ${attachedImage ? 'text-accent opacity-100 bg-accent/5' : 'opacity-20 hover:opacity-100 hover:bg-secondary'}`} disabled={isLoading}><Paperclip size={18} /></button>
                <button onClick={handleSend} className={`p-3.5 relative group liquid-transition active:scale-90 ${isLoading ? 'bg-destructive' : 'bg-accent'} text-accent-foreground rounded-xl shadow-lg shadow-accent/20 disabled:opacity-50 transition-all`}>
                  {isLoading ? <Square size={16} fill="currentColor" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey={apiKey} setApiKey={() => {}} model={model} setModel={setModel} />
      </div>
    </main>
  );
}
