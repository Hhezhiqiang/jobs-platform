/**
 * 使用 AI 解析职位描述，提取结构化信息
 * 使用统一的 ai-client 替代直接 fetch
 */

import { aiChatJSON } from "@/lib/ai-client";

interface ParsedJobDescription {
  description: string; // 岗位职责
  requirements: string; // 任职要求
  benefits: string; // 福利待遇
}

export async function parseJobDescriptionWithAI(
  rawDescription: string,
): Promise<ParsedJobDescription> {
  try {
    const parsed = await aiChatJSON<ParsedJobDescription>(
      [
        {
          role: "system",
          content: `你是一个专业的职位描述解析器。请将原始的职位描述文本解析为结构化的三个部分：
1. 岗位职责 (description) - 该职位需要做什么
2. 任职要求 (requirements) - 需要什么技能、经验、学历
3. 福利待遇 (benefits) - 公司提供什么福利

如果原文中没有明确提到某个部分，就返回空字符串。
只返回 JSON 格式，不要其他内容。`,
        },
        {
          role: "user",
          content: `请解析以下职位描述：\n\n${rawDescription.substring(0, 3000)}`,
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 4000,
        // 相同职位描述直接命中缓存，减少 AI 调用成本
        cacheTTL: 86400, // 24小时
        maxRetries: 2,
      },
    );

    return {
      description: parsed.description || rawDescription.substring(0, 500),
      requirements: parsed.requirements || "",
      benefits: parsed.benefits || "",
    };
  } catch (error: unknown) {
    console.error("AI 解析失败:", (error as Error).message);
    return {
      description: rawDescription.substring(0, 500),
      requirements: "",
      benefits: "",
    };
  }
}
