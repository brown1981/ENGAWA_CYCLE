import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 401 });
    }

    const { messages, model } = await req.json();

    const openai = new OpenAI({ apiKey });

    // Phase 1: シンプルに非ストリーミングで応答を返す
    const isSearchModel = model?.includes("search");
    
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o-mini-search-preview",
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      ...(isSearchModel ? { web_search_options: {} } : {}),
    } as any);

    const assistantMessage = response.choices[0].message;

    return NextResponse.json({
      id: response.id,
      role: "assistant",
      content: assistantMessage.content,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from OpenAI" },
      { status: 500 }
    );
  }
}
