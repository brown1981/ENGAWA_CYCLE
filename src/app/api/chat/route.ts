import { NextResponse } from "next/server";
import { ProviderFactory } from "@/lib/providers/factory";
export const runtime = "edge";
export async function POST(req: Request) {
  const body = await req.json();
  const { messages, model, isAgentic = true } = body;
  const keys = { openai: req.headers.get("Authorization")?.split(" ")[1], anthropic: req.headers.get("X-Anthropic-Key"), gemini: req.headers.get("X-Gemini-Key") };
  if (!isAgentic && (model.startsWith("gemini") || model.startsWith("claude"))) {
    const provider = ProviderFactory.getProvider(model);
    const result = await provider.generateResponse(messages, { model, apiKey: model.startsWith("gemini") ? keys.gemini! : keys.anthropic! });
    return NextResponse.json(result);
  }
  const { AgentExecutor } = await import("@/lib/agents/executor");
  const executor = new AgentExecutor(keys.openai!, "req-123", { anthropicKey: keys.anthropic, geminiKey: keys.gemini });
  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(d) + "\n"));
      const res = await executor.runV2(messages, model, (s) => send({ type: "status", content: s }));
      send({ type: "final", ...res });
      controller.close();
    }
  });
  return new Response(stream);
}
