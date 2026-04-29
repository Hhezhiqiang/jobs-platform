/**
 * LLM 兼容层 — 委托给新的统一 AI 客户端
 * @deprecated 请直接使用 @/lib/ai-client 中的 aiChat / aiAsk / aiChatJSON
 */

export {
  llmChat,
  getLLMProviderConfig,
  isAIConfigured,
  aiChat,
  aiAsk,
  aiChatJSON,
  clearCache,
} from "./ai-client";

// 别名保持向后兼容
export { isAIConfigured as isLLMConfigured } from "./ai-client";

// 重新导出类型保持兼容
export type { LLMMessage, LLMOptions } from "./ai-client";
