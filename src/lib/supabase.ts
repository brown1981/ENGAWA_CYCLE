import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * 🏢 getSupabase (既存機能用)
 * ブラウザ側の ChatContext が、画面から入力された設定で
 * その場でクライアントを生成するために使用します。
 */
export const getSupabase = (url?: string, key?: string) => {
  const targetUrl = url || supabaseUrl;
  const targetKey = key || supabaseAnonKey;
  if (!targetUrl || !targetKey) return null;
  return createClient(targetUrl, targetKey);
};

/**
 * 🏰 supabase (エージェント・ツール用)
 * Vercel の環境変数を使用して、バックエンドで安定して動作します。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
