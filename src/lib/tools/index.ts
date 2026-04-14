/**
 * 🛠️ Engawa Cycle - Tool Registry
 * AI社員が「手足」として使用できる関数の定義集
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<any>;
}

import { get_crypto_price } from "./crypto";
import { manage_tasks } from "./tasks";
import { web_search } from "./web_search";

// ツール一覧の登録
export const tools: Record<string, ToolDefinition> = {
  get_crypto_price,
  manage_tasks,
  web_search,
};

// OpenAI形式のスキーマ一覧を生成
export const toolSchemas = Object.values(tools).map(t => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }
}));
