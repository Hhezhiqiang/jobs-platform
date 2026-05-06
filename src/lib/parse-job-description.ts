/**
 * 使用 AI 解析职位描述，提取结构化信息
 * 优化：批量并发处理 + 描述去重缓存
 */

import { aiChatJSON } from "@/lib/ai-client";
import { logger } from '@/lib/logger';

interface ParsedJobDescription {
  description: string;  // 岗位职责
  requirements: string; // 任职要求
  benefits: string;     // 福利待遇
}

// 描述内容缓存：按描述文本的 hash 去重
const descriptionCache = new Map<string, ParsedJobDescription>();

// 并发池：简单的信号量实现
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

/**
 * 判断是否需要对职位调用 AI 解析
 */
export function needsAIParsing(description: string): boolean {
  const hasStructure = /岗位职责|任职要求|岗位要求|responsibilities|requirements|qualifications/i.test(description);
  if (description.length < 200) return false;
  return !hasStructure;
}

/**
 * 简化描述文本用于缓存 key（取前 500 字符的 hash）
 */
function cacheKey(description: string): string {
  let hash = 0;
  const text = description.substring(0, 500);
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // convert to 32bit integer
  }
  return `desc:${hash}:${text.length}`;
}

/**
 * 单条 AI 解析（带内部缓存 + 重试已在 ai-client 中处理）
 */
async function parseSingle(rawDescription: string): Promise<ParsedJobDescription> {
  const key = cacheKey(rawDescription);
  const cached = descriptionCache.get(key);
  if (cached) return cached;

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
        cacheTTL: 86400,
        maxRetries: 2,
      },
    );

    const result: ParsedJobDescription = {
      description: parsed.description || rawDescription.substring(0, 500),
      requirements: parsed.requirements || "",
      benefits: parsed.benefits || "",
    };
    descriptionCache.set(key, result);
    return result;
  } catch (error: unknown) {
    logger.error("AI 解析失败:", (error as Error).message);
    const fallback: ParsedJobDescription = {
      description: rawDescription.substring(0, 500),
      requirements: "",
      benefits: "",
    };
    descriptionCache.set(key, fallback);
    return fallback;
  }
}

/**
 * 单条解析（保持向后兼容）
 */
export async function parseJobDescriptionWithAI(
  rawDescription: string,
): Promise<ParsedJobDescription> {
  return parseSingle(rawDescription);
}

/**
 * 批量并发解析职位描述
 * @param descriptions 需要 AI 解析的描述数组（已过滤）
 * @param concurrency 并发度，默认 5
 * @returns 解析结果数组（与输入顺序一致）
 */
export async function parseJobDescriptionsBatch(
  descriptions: { id: string; description: string }[],
  concurrency: number = 5,
): Promise<Map<string, ParsedJobDescription>> {
  const semaphore = new Semaphore(concurrency);
  const results = new Map<string, ParsedJobDescription>();

  // 先去重：相同描述只调用一次 AI
  const uniqueDescriptions = new Map<string, string>(); // cacheKey -> rawDescription
  const keyToIds = new Map<string, string[]>();         // cacheKey -> [jobId, ...]

  for (const item of descriptions) {
    const key = cacheKey(item.description);
    const cached = descriptionCache.get(key);
    if (cached) {
      // 命中内存缓存
      results.set(item.id, cached);
      continue;
    }
    if (!uniqueDescriptions.has(key)) {
      uniqueDescriptions.set(key, item.description);
      keyToIds.set(key, []);
    }
    keyToIds.get(key)!.push(item.id);
  }

  if (uniqueDescriptions.size === 0) {
    return results;
  }


  const entries = Array.from(uniqueDescriptions.entries());

  const promises = entries.map(async ([key, rawDesc]) => {
    await semaphore.acquire();
    try {
      const parsed = await parseSingle(rawDesc);
      // 将结果复制给所有共享该描述的职位
      const ids = keyToIds.get(key)!;
      for (const id of ids) {
        results.set(id, parsed);
      }
    } finally {
      semaphore.release();
    }
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * 清空解析缓存（用于测试或手动刷新）
 */
export function clearParseCache(): void {
  descriptionCache.clear();
}
