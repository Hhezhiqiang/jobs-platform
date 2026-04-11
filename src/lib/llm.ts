// Lightweight OpenAI-compatible LLM client
// Supports multiple providers via environment variables

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function getProviderConfig() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const kimiKey = process.env.KIMI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (kimiKey) {
    return {
      apiKey: kimiKey,
      baseUrl: process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1",
      defaultModel: process.env.KIMI_MODEL || "kimi-k2-0711-preview",
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

export async function llmChat(messages: LLMMessage[], options: LLMOptions = {}) {
  const config = getProviderConfig();
  if (!config) {
    throw new Error("No LLM API key configured. Set OPENAI_API_KEY, KIMI_API_KEY, or DEEPSEEK_API_KEY.");
  }

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
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export function isLLMConfigured() {
  return !!getProviderConfig();
}
