export type ChatRole = "user" | "assistant" | "system";
export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt: string; };
export type ChatSession = { id: string; title: string; provider: string; model: string; messages: ChatMessage[]; updatedAt: string; };
export type ModelOption = { id: string; name: string; description: string; provider: "openai" | "anthropic" | "google"; };
export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "gpt-4o", name: "Executive (GPT-4o)", description: "High intelligence.", provider: "openai" },
  { id: "claude-3-5-sonnet-latest", name: "Reasoning (Claude)", description: "Logic specialist.", provider: "anthropic" },
  { id: "gemini-1.5-pro-latest", name: "Analysis (Gemini)", description: "Deep analysis.", provider: "google" },
  { id: "gpt-4o-mini", name: "Fast (Mini)", description: "Quick tasks.", provider: "openai" },
];
export type AppTheme = "ink" | "zen" | "aether";
export type AppearanceMode = "light" | "dark" | "auto";
export type AgentProfile = { id: string; name: string; role: string; responsibility: string; instructions: string; model: string; };
export type GlobalSettings = { theme: AppTheme; appearanceMode: AppearanceMode; typingSpeed: number; retentionDays: number; autoSearch: boolean; supabaseUrl?: string; supabaseAnonKey?: string; syncKey?: string; openaiKey?: string; anthropicKey?: string; geminiKey?: string; searchKey?: string; customInstructions?: string; agents?: AgentProfile[]; };
