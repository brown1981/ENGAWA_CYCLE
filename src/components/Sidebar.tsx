"use client";

import { X, Plus, MessageSquare, Trash2, ChevronLeft } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatSession } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { 
    sessions, 
    currentSessionId, 
    setCurrentSessionId, 
    createSession, 
    removeSession 
  } = useChatContext();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 liquid-transition animate-in fade-in duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-card/90 backdrop-blur-3xl z-50 
        border-r border-border/60 liquid-transition
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-30 font-heading">Personnel Archive</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-xl liquid-transition active:scale-90"
            >
              <ChevronLeft size={16} className="opacity-40" />
            </button>
          </div>

          <button 
            onClick={() => {
              createSession();
              onClose();
            }}
            className="flex items-center justify-center gap-3 w-full px-6 py-4 mb-10 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.98] liquid-transition shadow-2xl shadow-primary/10"
          >
            <Plus size={16} />
            <span>New Strategic Session</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 no-scrollbar">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center opacity-20 text-[10px] font-bold uppercase tracking-widest italic font-heading">
                Empty Records
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  className="group relative flex items-center"
                >
                  <button
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      onClose();
                    }}
                    className={`
                      flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-sm liquid-transition text-left truncate
                      ${currentSessionId === session.id 
                        ? "bg-accent/10 text-accent font-semibold border border-accent/20" 
                        : "hover:bg-secondary/80 opacity-60 hover:opacity-100"}
                    `}
                  >
                    <MessageSquare size={15} className={currentSessionId === session.id ? "opacity-100" : "opacity-30"} />
                    <span className="truncate flex-1 pr-6">{session.title || "Untitled Intelligence"}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSession(session.id);
                    }}
                    className="absolute right-3 p-2 opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-red-500 liquid-transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-border/40 px-2">
            <div className="text-[9px] opacity-20 uppercase font-black tracking-[0.4em] font-heading">
              Engawa Cycle OS v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
