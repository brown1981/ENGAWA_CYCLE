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
  provider: string; 
  model: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ModelOption = {
  id: string;
  name: string;
  description: string;
  provider: "openai" | "anthropic" | "google";
};

export const AVAILABLE_MODELS: ModelOption[] = [
  { 
    id: "gpt-4o", 
    name: "Deep Performance (GPT)", 
    description: "Highest intelligence for complex strategy and orchestration.",
    provider: "openai"
  },
  { 
    id: "claude-3-5-sonnet-20241022", 
    name: "Claude 3.5 Sonnet", 
    description: "Exceptional reasoning, coding, and character.",
    provider: "anthropic"
  },
  { 
    id: "gemini-1.5-pro", 
    name: "Advanced Analysis (Gemini)", 
    description: "Google's most capable model for sophisticated reasoning.",
    provider: "google"
  },
  { 
    id: "gemini-1.5-flash", 
    name: "Swift & Adaptive (Gemini)", 
    description: "Fast responses with an expansive cognitive window.",
    provider: "google"
  },
  { 
    id: "gpt-4o-mini", 
    name: "Light & Swift (GPT)", 
    description: "Optimized for speed and efficient daily tasks.",
    provider: "openai"
  },
];

// For backward compatibility while migration
export const OPENAI_MODELS = AVAILABLE_MODELS.filter(m => m.provider === "openai");

export type AppTheme = "ink" | "zen" | "aether";
export type AppearanceMode = "light" | "dark" | "auto";

export type GlobalSettings = {
  theme: AppTheme;
  appearanceMode: AppearanceMode;
  typingSpeed: number;
  retentionDays: number;
  autoSearch: boolean;
  // Phase 4: Sync Settings
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  syncKey?: string;
  // Phase 4.2, 4.3 & 6: Multi-provider & Persistence
  openaiKey?: string; 
  anthropicKey?: string;
  geminiKey?: string;
  searchKey?: string; 
  customInstructions?: string;
};
