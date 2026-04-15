"use client";
import { X, Users, Cloud, Cpu, BrainCircuit } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { AVAILABLE_MODELS } from "@/lib/types";
export function SettingsModal({ isOpen, onClose, model, setModel }: any) {
  const { settings, updateSettings } = useChatContext();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
      <div className="bg-card border border-border/40 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] overflow-hidden">
        <header className="p-10 border-b border-border/10 flex justify-between items-center bg-secondary/5">
          <div className="space-y-1">
            <h2 className="font-bold text-xl tracking-tight flex items-center gap-2">OS Preferences</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30 font-bold">System Governance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-all opacity-30 hover:opacity-100"><X size={20}/></button>
        </header>
        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
           <section className="space-y-6">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2"><BrainCircuit size={12}/> Intellect Profile</h3>
             <textarea value={settings.customInstructions || ""} onChange={e => updateSettings({ customInstructions: e.target.value })} className="w-full p-6 bg-secondary/30 border border-border/10 rounded-2xl text-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="Agent strategy directives..." />
           </section>
           <section className="space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-2"><Users size={12}/> AI Organization Chart</h3>
               <button onClick={() => {
                 const n = { id: crypto.randomUUID(), name: "Specialist", role: "Researcher", responsibility: "Intelligence", instructions: "Deep dive analysis", model: "gpt-4o-mini" };
                 updateSettings({ agents: [...(settings.agents || []), n] });
               }} className="text-[9px] font-bold text-accent bg-accent/10 px-4 py-2 rounded-xl hover:bg-accent/20 transition-all uppercase tracking-widest">Recruit Personnel</button>
             </div>
             <div className="space-y-4">
               {(settings.agents || []).map((a: any, i: number) => (
                 <div key={a.id} className="p-6 bg-secondary/15 border border-border/10 rounded-3xl space-y-4 hover:border-accent/20 transition-all">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center text-accent"><Cpu size={18} /></div>
                       <input value={a.name} onChange={e => { const n = [...settings.agents]; n[i].name = e.target.value; updateSettings({ agents: n }); }} className="bg-transparent font-bold text-sm focus:outline-none border-b border-transparent focus:border-accent/20" />
                     </div>
                     <button onClick={() => updateSettings({ agents: settings.agents.filter((x: any) => x.id !== a.id) })} className="opacity-20 hover:opacity-100 hover:text-destructive"><X size={16}/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <select value={a.model} onChange={e => { const n = [...settings.agents]; n[i].model = e.target.value; updateSettings({ agents: n }); }} className="bg-background/40 border border-border/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
                       {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                     <input value={a.role} onChange={e => { const n = [...settings.agents]; n[i].role = e.target.value; updateSettings({ agents: n }); }} className="bg-background/40 border border-border/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider" placeholder="Role (e.g. Architect)" />
                   </div>
                 </div>
               ))}
               {(settings.agents || []).length === 0 && <div className="py-12 border border-dashed border-border/20 rounded-3xl text-center opacity-20 text-[10px] uppercase font-bold tracking-widest">No active personnel</div>}
             </div>
           </section>
        </div>
        <footer className="p-10 border-t border-border/10 bg-secondary/5 flex justify-between items-center">
          <button onClick={async () => {
            if (!settings.supabaseUrl || !settings.supabaseAnonKey) return alert("Supabase config required.");
            const { getSupabase } = await import("@/lib/supabase");
            const supabase = getSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
            const { error } = await supabase!.from('agents').upsert(settings.agents.map((a:any) => ({ id: a.id, name: a.name, role: a.role, instructions: a.instructions, model: a.model })));
            alert(error ? "Sync Error" : "Organization Master Synchronized.");
          }} className="text-[9px] font-bold text-accent flex items-center gap-2 hover:opacity-70 transition-all uppercase tracking-[0.2em]"><Cloud size={14}/> Sync Organization</button>
          <button onClick={onClose} className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">Authorize</button>
        </footer>
      </div>
    </div>
  );
}
