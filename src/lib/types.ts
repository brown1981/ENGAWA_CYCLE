/**
 * 🎨 Minimal LLM Workspace - Types definition
 */

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  provider: string; // "openai"
  model: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ModelOption = {
  id: string;
  name: string;
  description: string;
};

// Phase 3 Final Evolution: 隠し設定としてモデルを保持
export const OPENAI_MODELS: ModelOption[] = [
  { 
    id: "gpt-4o-search-preview", 
    name: "Deep Performance", 
    description: "Highest intelligence with autonomous search." 
  },
  { 
    id: "gpt-4o-mini-search-preview", 
    name: "Light & Swift", 
    description: "Fast responses with autonomous search." 
  },
];

export type AppTheme = "pure-black" | "glass" | "paper";

export type GlobalSettings = {
  theme: AppTheme;
  typingSpeed: number; // 0 to 100
  retentionDays: number;
  autoSearch: boolean;
};
