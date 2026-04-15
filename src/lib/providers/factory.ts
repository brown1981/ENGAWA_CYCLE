import { GeminiProvider } from "./gemini";
import { AnthropicProvider } from "./anthropic";
import { AIProvider } from "./types";
export class ProviderFactory {
  static getProvider(modelName: string): AIProvider {
    if (modelName.startsWith("gemini")) return new GeminiProvider();
    if (modelName.startsWith("claude")) return new AnthropicProvider();
    throw new Error(`Unsupported: ${modelName}`);
  }
}
