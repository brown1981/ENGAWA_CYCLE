import { AIProvider, Message, ProviderOptions, ProviderResponse } from "./types";
export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  async generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse> {
    const { model, apiKey, systemPrompt } = options;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt, messages: messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })) })
    });
    const data = await response.json();
    return { id: data.id, role: "assistant", content: data.content[0].text, createdAt: new Date().toISOString() };
  }
}
