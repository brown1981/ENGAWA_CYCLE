import { AIProvider, Message, ProviderOptions, ProviderResponse } from "./types";
export class GeminiProvider implements AIProvider {
  name = "gemini";
  async generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse> {
    const { model, apiKey, systemPrompt } = options;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
    };
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    return { id: Date.now().toString(), role: "assistant", content: data.candidates[0].content.parts[0].text, createdAt: new Date().toISOString() };
  }
}
