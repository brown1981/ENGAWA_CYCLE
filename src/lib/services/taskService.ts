import { supabase } from "@/lib/supabase";
export class TaskService {
  async logTask(log: any) { await supabase.from("tasks").insert([log]); }
  async loadAgentProfile(role: string) {
    const { data } = await supabase.from("agents").select("*").eq("role", role).maybeSingle();
    return data;
  }
}
