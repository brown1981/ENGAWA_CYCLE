"use client";
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Settings, Send, BrainCircuit } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
export default function Home() {
  const { messages, sendMessage, isLoading, status, model, setModel } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [input, setInput] = useState("");
  return (
    <main className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col relative">
        <header className="p-6 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 bg-background/50">
          <h1 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2"><BrainCircuit size={16}/> Engawa Cycle</h1>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-secondary rounded-lg"><Settings size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-accent text-accent-foreground shadow-lg' : 'bg-card border shadow-sm'}`}>{m.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center animate-pulse py-4">
              <div className="text-[10px] uppercase tracking-widest bg-accent/10 text-accent px-6 py-2 rounded-full border border-accent/20 shadow-glow">{status || "Orchestrating..."}</div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Declare strategy..." className="w-full p-6 bg-card border border-border/40 rounded-3xl shadow-2xl resize-none pr-16 focus:outline-none focus:ring-1 focus:ring-accent/30" rows={1} />
            <button onClick={() => { sendMessage(input); setInput(""); }} className="absolute right-4 bottom-4 p-3 bg-accent text-accent-foreground rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={18} /></button>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} model={model} setModel={setModel} />
      </div>
    </main>
  );
}
