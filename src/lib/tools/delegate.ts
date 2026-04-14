import { ToolDefinition } from "./index";

/**
 * 🤝 Multi-Agent Delegation Tool (Phase 7: 組織化)
 * エージェントが別の専門エージェントに仕事を依頼するための「指令書」
 */
export const delegate_task: ToolDefinition = {
  name: "delegate_task",
  description: "別の専門エージェント（Researcher, Trader, Analyst等）に特定の調査や分析を依頼します。複雑な課題を分担する際に使用してください。",
  parameters: {
    type: "object",
    properties: {
      agent_role: {
        type: "string",
        enum: ["Manager", "Researcher", "Trader", "Analyst"],
        description: "依頼先のエージェントの役割",
      },
      instruction: {
        type: "string",
        description: "エージェントへの具体的な指示内容",
      },
    },
    required: ["agent_role", "instruction"],
  },
  execute: async ({ agent_role, instruction }, context?: any) => {
    try {
      console.log(`[Tool:delegate_task] Delegating to ${agent_role}: ${instruction.slice(0, 50)}...`);

      // 呼び出し元の Executor インスタンスまたは委譲用関数がコンテキストにあるか確認
      if (!context?.delegate) {
        throw new Error("Delegation engine is not initialized in the current context.");
      }

      // 別のエージェントに仕事を依頼し、その結果を待つ
      const result = await context.delegate(agent_role, instruction);

      return {
        from_agent: agent_role,
        status: "completed",
        report: result.content,
        metadata: {
          requestId: result.id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error("[Tool:delegate_task] Error:", error);
      return { error: error.message || "Failed to delegate task." };
    }
  },
};
