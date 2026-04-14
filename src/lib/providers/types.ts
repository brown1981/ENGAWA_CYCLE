export interface Message { role: "user" | "assistant" | "system" | "tool"; content: string; name?: string; tool_call_id?: string; }
export interface ProviderResponse { id: string; content: string; role: "assistant"; createdAt: string; }
export interface ProviderOptions { model: string; temperature?: number; maxTokens?: number; systemPrompt?: string; apiKey: string; imageData?: { mimeType: string; base64Data: string; }; }
export interface AIProvider { name: string; generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse>; }
