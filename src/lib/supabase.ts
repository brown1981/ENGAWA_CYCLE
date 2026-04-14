import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * 🏰 Engawa Cycle - Supabase Client
 * Vercel の環境変数を使用して、DBとの通信を確立します。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
