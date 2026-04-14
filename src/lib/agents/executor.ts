import { OpenAI } from "openai";
import { toolSchemas, tools } from "@/lib/tools";
import { supabase } from "@/lib/supabase";

/**
 * 🧠 Engawa Cycle - Agent Executor
 * AI社員の「思考ループ」を統合管理するコアエンジン
 */
export class AgentExecutor {
  private openai: OpenAI;
  private requestId: string;
  private maxLoops: number;
  private agentId: string | null = null;
  private agentInfo: any = null;
  private extraKeys: { anthropicKey?: string; geminiKey?: string; searchKey?: string; } = {};
  private recursionDepth: number;

  constructor(apiKey: string, requestId: string, extraKeys: { anthropicKey?: string; geminiKey?: string; searchKey?: string; } = {}, maxLoops: number = 5, recursionDepth: number = 0) {
    this.openai = new OpenAI({ apiKey, timeout: 60000 }); // Delegation needs longer timeout
    this.requestId = requestId;
    this.extraKeys = extraKeys;
    this.maxLoops = maxLoops;
    this.recursionDepth = recursionDepth;
  }

  /**
   * 別のエージェントに仕事を依頼する
   */
  async delegate(role: string, instruction: string, model: string = "gpt-4o-mini") {
    if (this.recursionDepth >= 3) {
      throw new Error("Maximum delegation depth (3) reached. Preventing infinite loops.");
    }

    console.log(`[Executor:${this.requestId}] Delegating to ${role} (Depth: ${this.recursionDepth + 1})...`);
    
    // 自ネットワークに OpenAI Key を引き継ぐ
    const subExecutor = new AgentExecutor(
      (this.openai as any).apiKey, 
      `${this.requestId}-sub-${role.toLowerCase()}`,
      this.extraKeys,
      this.maxLoops,
      this.recursionDepth + 1
    );

    await subExecutor.loadAgent(role);
    
    // システムプロンプトを構築して実行
    const subMessages = [
      {
        role: "system",
        content: `あなたはエージェント「${subExecutor.agentInfo?.name || role}」です。役割: ${subExecutor.agentInfo?.instructions || "指示に従ってください"}`
      },
      { role: "user", content: instruction }
    ];

    return subExecutor.runV2(subMessages, model);
  }

  /**
   * DBから特定のエージェント（役職）の情報をロードします
   */
  async loadAgent(role: string = "Manager") {
    console.log(`[Executor:${this.requestId}] Loading agent with role: ${role}`);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("role", role)
      .maybeSingle();

    if (error) {
      console.warn(`[Executor:${this.requestId}] Failed to load agent:`, error);
      return null;
    }

    if (data) {
      this.agentId = data.id;
      this.agentInfo = data;
      return data;
    }
    return null;
  }

  /**
   * 社長（ユーザー）からの指示を受け取り、
   * 必要ならツールを使いながら最終的な解決策を導き出す。
   */
  async runV2(messages: any[], model: string) {
    let loopCount = 0;
    const history = [...messages];

    while (loopCount < this.maxLoops) {
      console.log(`[Executor:${this.requestId}] Loop ${loopCount + 1}...`);
      
      const completion = await this.openai.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: history,
        tools: toolSchemas as any, 
        tool_choice: "auto",
      });

      const assistantMessage = completion.choices[0].message;
      history.push(assistantMessage);

      // 1. ツール呼び出しがない＝思考完了
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        console.log(`[Executor:${this.requestId}] Goal reached.`);
        return {
          id: completion.id,
          content: assistantMessage.content,
          history
        };
      }

      // 2. ツール呼び出しがある＝行動して観察
      console.log(`[Executor:${this.requestId}] Executing ${assistantMessage.tool_calls.length} tools...`);
      
      for (const toolCall of assistantMessage.tool_calls) {
        const tool = tools[toolCall.function.name];
        if (tool) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.execute(args, {
              requestId: this.requestId,
              agentId: this.agentId,
              delegate: this.delegate.bind(this),
              ...this.extraKeys
            });
            
            // Phase 7: 自動業務記録 (タスクログ)
            if (this.agentId) {
              await supabase.from("tasks").insert([{
                title: `${this.agentInfo?.name || "AI"}: ${toolCall.function.name}`,
                description: `Arguments: ${JSON.stringify(args)} \nResult: ${JSON.stringify(result)}`,
                assigned_to: this.agentId,
                status: "done",
                parent_request_id: this.requestId
              }]);
            }

            history.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err: any) {
            console.error(`[Executor:${this.requestId}] Tool Error (${toolCall.function.name}):`, err);
            history.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: err.message || "Execution failed" }),
            });
          }
        } else {
          console.warn(`[Executor:${this.requestId}] Tool not found: ${toolCall.function.name}`);
        }
      }

      loopCount++;
    }

    throw new Error(`Maximum thinking loops (${this.maxLoops}) reached.`);
  }
}
