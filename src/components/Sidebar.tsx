"use client";
import { useChatContext } from "@/contexts/ChatContext";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { ChatSession } from "@/lib/types";

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sessions, currentSessionId, setCurrentSessionId, createSession, removeSession } = useChatContext();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex flex-col h-full p-4">
        <button onClick={() => { createSession(); onClose(); }} className="flex items-center gap-2 w-full p-3 bg-accent text-accent-foreground rounded-xl mb-6 font-bold text-xs uppercase tracking-widest hover:opacity-90">
          <Plus size={16} /> New Intelligence
        </button>
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="py-20 text-center opacity-20 text-[9px] font-bold uppercase tracking-widest">No active records</div>
          ) : (
            sessions.map((session: ChatSession) => (
              <div key={session.id} className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? "bg-secondary text-foreground" : "hover:bg-secondary/50 opacity-40 hover:opacity-100"}`}>
                <div onClick={() => { setCurrentSessionId(session.id); onClose(); }} className="flex-1 flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate text-xs font-medium">{session.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
