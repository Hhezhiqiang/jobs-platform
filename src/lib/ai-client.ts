/**
 * 统一 AI 调用抽象层
 * - 多提供商支持（Kimi / OpenAI / DeepSeek）
 * - 自动重试（指数退避）
 * - 可配置内存/Redis 缓存
 * - 统一入口，替代所有直接 fetch AI API 的调用
 */

// ─── 配置 ─────────────────────────────────────────────────────

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  cacheKey?: string;
  cacheTTL?: number; // 秒，默认 3600（1小时）
  skipCache?: boolean;
  timeoutMs?: number;
}

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── 提供商配置 ────────────────────────────────────────────────

function getProviderConfig(): ProviderConfig | null {
  const kimiKey = process.env.KIMI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (kimiKey) {
    return {
      apiKey: kimiKey,
      baseUrl: process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1",
      defaultModel: process.env.KIMI_MODEL || "moonshot-v1-8k",
    };
  }

  if (deepseekKey) {
    return {
      apiKey: deepseekKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
      defaultModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }

  if (openaiKey) {
    return {
      apiKey: openaiKey,
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  return null;
}

export function isAIConfigured(): boolean {
  return !!getProviderConfig();
}

// ─── 缓存 ─────────────────────────────────────────────────────

// 内存缓存（LRU 简化版）
const memoryCache = new Map<string, { value: AIResponse; expiresAt: number }>();
const DEFAULT_CACHE_TTL = 3600; // 1 小时

function cacheGet(key: string): AIResponse | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key: string, value: AIResponse, ttlSeconds: number): void {
  // 限制缓存条目数
  if (memoryCache.size >= 500) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache(): void {
  memoryCache.clear();
}

function buildCacheKey(messages: AIMessage[], options: AIRequestOptions): string {
  if (options.cacheKey) return options.cacheKey;
  return `ai:${JSON.stringify(messages)}:${options.model ?? ""}:${options.temperature ?? 0.3}`;
}

// ─── 重试逻辑 ─────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // 指数退避: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("AI request failed after retries");
}

// ─── 核心调用 ─────────────────────────────────────────────────

async function callAPIOnce(
  config: ProviderConfig,
  messages: AIMessage[],
  options: AIRequestOptions,
): Promise<AIResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || config.defaultModel,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return { content, usage };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 统一 AI 聊天调用入口
 * 替代所有直接 fetch AI API 的调用
 */
export async function aiChat(
  messages: AIMessage[],
  options: AIRequestOptions = {},
): Promise<string> {
  const config = getProviderConfig();
  if (!config) {
    throw new Error("No AI API key configured. Set KIMI_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY.");
  }

  // 检查缓存
  const cacheKey = buildCacheKey(messages, options);
  if (!options.skipCache) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached.content;
  }

  // 调用 + 重试
  const maxRetries = options.maxRetries ?? 2;
  const result = await withRetry(
    () => callAPIOnce(config, messages, options),
    maxRetries,
  );

  // 写入缓存
  if (result.content) {
    cacheSet(cacheKey, result, options.cacheTTL ?? DEFAULT_CACHE_TTL);
  }

  return result.content;
}

/**
 * JSON 格式输出调用（自动重试 + 缓存）
 */
export async function aiChatJSON<T = Record<string, unknown>>(
  messages: AIMessage[],
  options: AIRequestOptions = {},
): Promise<T> {
  const content = await aiChat(messages, {
    ...options,
    maxTokens: options.maxTokens ?? 4000,
  });

  // 提取 JSON（容忍前后缀）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`AI response is not valid JSON: ${content.substring(0, 200)}`);
  }

  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * 便捷：单条用户消息快速调用
 */
export async function aiAsk(prompt: string, options?: AIRequestOptions): Promise<string> {
  return aiChat([{ role: "user", content: prompt }], options);
}

// ─── 兼容旧 llm.ts 接口 ─────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 兼容旧版 llmChat，底层走 ai-client
 */
export async function llmChat(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
  return aiChat(messages as AIMessage[], options);
}

export { getProviderConfig as getLLMProviderConfig };
