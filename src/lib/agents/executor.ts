import { OpenAI } from "openai";
import { toolSchemas, tools } from "@/lib/tools";
import { TaskService } from "@/lib/services/taskService";
export class AgentExecutor {
  private openai: OpenAI;
  private taskService: TaskService;
  constructor(apiKey: string, private requestId: string, private extraKeys: any = {}, private recursionDepth: number = 0) {
    this.openai = new OpenAI({ apiKey });
    this.taskService = new TaskService();
  }
  async loadAgent(role: string) { return await this.taskService.loadAgentProfile(role); }
  async runV2(messages: any[], model: string, onStatus?: (s: string) => void) {
    let currentMessages = [...messages];
    for (let i = 0; i < 5; i++) {
      if (onStatus) onStatus(`Thinking (Loop ${i+1})...`);
      const response = await this.openai.chat.completions.create({ model, messages: currentMessages, tools: toolSchemas });
      const message = response.choices[0].message;
      if (!message.tool_calls) return { content: message.content || "" };
      currentMessages.push(message);
      for (const t of message.tool_calls) {
        if (onStatus) onStatus(`Using tool: ${t.function.name}...`);
        const result = await (tools as any)[t.function.name](JSON.parse(t.function.arguments), this.extraKeys);
        currentMessages.push({ role: "tool", tool_call_id: t.id, content: JSON.stringify(result) });
      }
    }
    return { content: "Process Complete" };
  }
}
