import { ToolDefinition } from "./index";

import { supabase } from "../supabase";

/**
 * 🗄️ Task Management Tool
 * AI社員が自ら「DBに業務を記録する」ための手足
 */
export const manage_tasks: ToolDefinition = {
  name: "manage_tasks",
  description: "会社のタスク（業務）をデータベースに記録・更新します。",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "list"],
        description: "操作内容。create(作成) または list(一覧取得)",
      },
      title: {
        type: "string",
        description: "タスクのタイトル（create時必須）",
      },
      description: {
        type: "string",
        description: "タスクの詳細内容",
      },
    },
    required: ["action"],
  },
  execute: async ({ action, title, description }) => {
    try {
      if (action === "create") {
        const { data, error } = await supabase
          .from("tasks")
          .insert([{ title, description, status: "todo" }])
          .select();

        if (error) throw error;
        return { success: true, message: `タスク '${title}' をDBに記録しました。`, data };
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        return { success: true, count: data.length, tasks: data };
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Database action failed" };
    }
  },
};
