import { AIProvider, Message, ProviderOptions, ProviderResponse } from "./types";
export class GeminiProvider implements AIProvider {
  name = "gemini";
  async generateResponse(messages: Message[], options: ProviderOptions): Promise<ProviderResponse> {
    const { model, apiKey, systemPrompt, imageData } = options;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const body = {
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      contents: messages.map((m, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const parts: any[] = [];
        if (isLastMessage && imageData) { parts.push({ inline_data: { mime_type: imageData.mimeType, data: imageData.base64Data } }); }
        parts.push({ text: m.content });
        return { role: m.role === "assistant" ? "model" : "user", parts };
      }),
      generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens ?? 4096 }
    };
    const response = await fetch(url, { method: "POST", headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Gemini Error ${response.status}`);
    return { id: `gemini-${Date.now()}`, role: "assistant", content: data.candidates?.[0]?.content?.parts?.[0]?.text, createdAt: new Date().toISOString() };
  }
}
