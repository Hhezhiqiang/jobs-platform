import { prisma } from "@/lib/prisma";
import { normalizeKeyword, type RawKeywordItem } from "./keyword-sources";
import { googleTrendsAdapter } from "./keyword-sources/google-trends";
import { zhihuAdapter } from "./keyword-sources/zhihu";
import { redditAdapter } from "./keyword-sources/reddit";
import { jobMarketAdapter } from "./keyword-sources/job-market";
import { llmChat, isLLMConfigured } from "@/lib/llm";

const ADAPTERS = [jobMarketAdapter, googleTrendsAdapter, zhihuAdapter, redditAdapter];

// Recruitment-related whitelist for quick pre-filtering
const JOB_KEYWORDS_REGEX =
  /job|hiring|career|interview|resume|salary|recruit|offer|layoff|firing|engineer|manager|developer|programmer|designer|analyst|校招|春招|秋招|面试|简历|求职|招聘|薪资|大厂|裁员|算法|工程师|产品经理|程序员|设计师|数据分析师|运营/i;

export interface ClassificationResult {
  category: "PRIMARY" | "TRAFFIC" | "JUNK" | "HOLD";
  intent: "INFORMATIONAL" | "NAVIGATIONAL" | "TRANSACTIONAL" | "UNKNOWN";
  searchVolumeEstimate: "LOW" | "MEDIUM" | "HIGH";
  competition: "LOW" | "MEDIUM" | "HIGH";
  contentRecommendation: string;
  reasoning: string;
}

export async function collectKeywords(): Promise<{ inserted: number; duplicates: number; errors: number; newIds: string[] }> {
  let allItems: RawKeywordItem[] = [];

  for (const adapter of ADAPTERS) {
    try {
      const items = await adapter.fetch();
      allItems = allItems.concat(items);
    } catch (err) {
      console.error(`[keyword-monitor] adapter ${adapter.name} error:`, (err as Error).message);
    }
  }

  // Quick pre-filter: must contain job-related keywords
  allItems = allItems.filter((item) => JOB_KEYWORDS_REGEX.test(item.keyword));

  // Deduplicate by normalized keyword
  const uniqueMap = new Map<string, RawKeywordItem>();
  for (const item of allItems) {
    const norm = normalizeKeyword(item.keyword);
    if (!norm) continue;
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, item);
    }
  }

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const newIds: string[] = [];

  for (const [norm, item] of uniqueMap) {
    try {
      const exists = await prisma.keywordMonitor.findFirst({
        where: { normalized: norm },
      });

      if (exists) {
        // Update lastSeenAt and maybe trendScore if higher
        await prisma.keywordMonitor.update({
          where: { id: exists.id },
          data: {
            lastSeenAt: new Date(),
            trendScore: Math.max(exists.trendScore, item.trendScore || 0),
            source: item.source || exists.source,
          },
        });
        duplicates++;
        continue;
      }

      // Auto-classify
      const classification = await classifyKeyword(item.keyword);

      const created = await prisma.keywordMonitor.create({
        data: {
          keyword: item.keyword,
          normalized: norm,
          source: item.source || "unknown",
          sourceUrl: item.sourceUrl || null,
          trendScore: item.trendScore || 50,
          hotLevel: scoreToHotLevel(item.trendScore || 50),
          category: classification.category,
          intent: classification.intent,
          status: "PENDING",
          metadata: (item.metadata || {}) as any,
        },
      });
      newIds.push(created.id);
      inserted++;
    } catch (err) {
      console.error(`[keyword-monitor] failed to upsert "${norm}":`, (err as Error).message);
      errors++;
    }
  }

  return { inserted, duplicates, errors, newIds };
}

function scoreToHotLevel(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

async function classifyKeyword(keyword: string): Promise<ClassificationResult> {
  if (!isLLMConfigured()) {
    return fallbackClassify(keyword);
  }

  try {
    const systemPrompt = `你是一位招聘平台 SEO 专家。请分析关键词的商业价值并输出 JSON。只输出 JSON，不要 markdown 代码块。`;
    const userPrompt = `关键词: "${keyword}"

请从以下维度输出 JSON：
{
  "category": "PRIMARY" | "TRAFFIC" | "JUNK" | "HOLD",
  "intent": "INFORMATIONAL" | "NAVIGATIONAL" | "TRANSACTIONAL" | "UNKNOWN",
  "searchVolumeEstimate": "LOW" | "MEDIUM" | "HIGH",
  "competition": "LOW" | "MEDIUM" | "HIGH",
  "contentRecommendation": "建议发布的内容类型（博客/专题页/FAQ/不做）",
  "reasoning": "50字以内的判断依据"
}

定义：
- PRIMARY: 直接招聘相关，求职者会搜索并投递简历的词（如"Java工程师招聘"）
- TRAFFIC: 与职场相关但转化弱，适合引流（如"35岁程序员出路"）
- JUNK: 与招聘无关或明显负面/争议
- HOLD: 暂时看不清，先观望`;

    const content = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 600 }
    );

    const jsonText = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText) as ClassificationResult;
    return parsed;
  } catch (err) {
    console.error("[keyword-monitor] LLM classification failed, using fallback:", (err as Error).message);
    return fallbackClassify(keyword);
  }
}

function fallbackClassify(keyword: string): ClassificationResult {
  const k = keyword.toLowerCase();
  if (
    /招聘|求职|hire|hiring|jobs? near me|software engineer|data scientist|product manager|前端|后端|算法|工程师/i.test(k)
  ) {
    return {
      category: "PRIMARY",
      intent: "TRANSACTIONAL",
      searchVolumeEstimate: "HIGH",
      competition: "HIGH",
      contentRecommendation: "专题页",
      reasoning: "包含明确岗位和招聘意图，属于核心交易型关键词",
    };
  }
  if (/面试|简历|salary|offer|裁员|出路|职场|career advice/i.test(k)) {
    return {
      category: "TRAFFIC",
      intent: "INFORMATIONAL",
      searchVolumeEstimate: "MEDIUM",
      competition: "MEDIUM",
      contentRecommendation: "博客",
      reasoning: "与招聘间接相关，信息型搜索为主，适合内容引流",
    };
  }
  return {
    category: "HOLD",
    intent: "UNKNOWN",
    searchVolumeEstimate: "LOW",
    competition: "LOW",
    contentRecommendation: "不做",
    reasoning: "规则引擎无法明确分类，标记为观望",
  };
}

export { fallbackClassify };
