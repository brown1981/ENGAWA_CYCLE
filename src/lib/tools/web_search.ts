import { ToolDefinition } from "./index";

/**
 * 🔍 Web Search Tool (Phase 5:手足の拡張)
 * エージェントが外部の最新情報にアクセスするための検索エンジン
 * 推奨: Tavily API (https://tavily.com/)
 */
export const web_search: ToolDefinition = {
  name: "web_search",
  description: "Web上から最新情報を検索し、結果を要約して取得します。市場動向やニュース、技術仕様の調査に使用してください。",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "検索クエリ（日本語・英語どちらも可）",
      },
      search_depth: {
        type: "string",
        enum: ["basic", "advanced"],
        description: "検索の深さ（advancedはより詳細な結果を返します）",
        default: "basic"
      }
    },
    required: ["query"],
  },
  execute: async ({ query, search_depth = "basic" }, context?: any) => {
    try {
      // API Key の取得 (Context経由 または 環境変数)
      const apiKey = context?.searchKey || process.env.TAVILY_API_KEY;

      if (!apiKey) {
        throw new Error("Tavily API Key is not configured in Settings.");
      }

      console.log(`[Tool:web_search] Searching for: ${query} (depth: ${search_depth})`);

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth,
          include_answer: true,
          max_results: 5
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Search API Error: ${err.detail || response.statusText}`);
      }

      const data = await response.json();

      return {
        query: data.query,
        answer: data.answer, // Tavilyによる自動要約
        results: data.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content.slice(0, 300) + "..."
        })),
        source: "Tavily AI Search"
      };
    } catch (error: any) {
      console.error("[Tool:web_search] Error:", error);
      return { error: error.message || "Failed to perform web search." };
    }
  },
};
