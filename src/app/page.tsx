"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { Settings, Send, Download, Copy, MessageSquare, Plus, Paperclip } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { exportToMarkdown } from "@/lib/export";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { 
    messages, 
    sendMessage, 
    apiKey, 
    setApiKey, 
    model, 
    setModel, 
    clearMessages, 
    isLoading, 
    error,
    createSession,
    streamingContent
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const injection = `\n\n--- [FILE: ${file.name}] ---\n${content}\n--- END FILE ---\n`;
      setInput(prev => prev + injection);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Header - The Ultimate Minimalist Hub (v8) */}
        <header className="flex justify-between items-center px-8 py-6 z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 opacity-10 hover:opacity-100 transition-opacity"
              title="Menu"
            >
              <MessageSquare size={18} />
            </button>
          </div>
          
          <div className="flex gap-4 items-center">
            {messages.length > 0 && (
              <div className="text-[10px] opacity-10 font-bold uppercase tracking-[0.2em] mr-4 select-none">
                {messages.length} Thoughts
              </div>
            )}
            <button 
              onClick={() => createSession()}
              className="p-2 opacity-10 hover:opacity-100 transition-opacity"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 opacity-10 hover:opacity-100 transition-opacity"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Chat Viewport */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-8 pb-36 pt-4 space-y-12 max-w-3xl mx-auto w-full scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
              <h1 className="text-5xl font-semibold tracking-tighter mix-blend-difference">Genesis</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]">思考を、そのままの形で。</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isLast = idx === messages.length - 1;
              const displayContent = (isLast && m.role === "assistant" && streamingContent) 
                ? streamingContent 
                : m.content;

              if (isLast && m.role === "assistant" && !m.content && !streamingContent) return null;

              return (
                <div 
                  key={m.id} 
                  className={`group flex flex-col space-y-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`
                    chat-bubble px-6 py-5 rounded-[2rem] shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-accent text-white rounded-tr-none' 
                      : 'bg-zinc-100 dark:bg-zinc-900 rounded-tl-none border border-zinc-200 dark:border-zinc-800'}
                  `}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {displayContent}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 px-4 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                    <button onClick={() => navigator.clipboard.writeText(m.content)} className="hover:opacity-100"><Copy size={14} /></button>
                    {m.role === 'assistant' && (
                      <button onClick={() => exportToMarkdown(m.content)} className="hover:opacity-100"><Download size={14} /></button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {isLoading && !streamingContent && (
            <div className="flex items-start">
              <div className="bg-zinc-100 dark:bg-zinc-900 px-6 py-5 rounded-[2rem] rounded-tl-none animate-pulse-slow">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-30">Synapsing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 text-red-500 text-xs rounded-[1.5rem] border border-red-100 dark:border-red-900/20">
              {error}
            </div>
          )}
        </div>

        {/* Input Area - Floating Glass */}
        <div className="fixed bottom-0 left-0 right-0 p-10 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <div className="relative group">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="思考を入力..."
                className="w-full bg-white dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] px-8 py-6 pr-32 shadow-2xl shadow-black/5 focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none min-h-[72px] max-h-48 custom-scrollbar leading-relaxed"
                rows={1}
              />
              <div className="absolute right-5 bottom-5 flex gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 opacity-20 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                  title="Attach"
                >
                  <Paperclip size={20} />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-accent text-white rounded-[1.2rem] disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={model}
          setModel={setModel}
        />
      </div>
    </main>
  );
}
