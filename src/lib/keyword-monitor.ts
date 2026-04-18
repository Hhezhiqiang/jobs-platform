import { prisma } from "@/lib/prisma";
import { normalizeKeyword, type RawKeywordItem } from "./keyword-sources";
import { jobMarketAdapter } from "./keyword-sources/job-market";
import { localHotTopicsAdapter } from "./keyword-sources/local-hot-topics";

const ADAPTERS = [
  jobMarketAdapter,      // 基于站内数据，最可靠
  localHotTopicsAdapter, // 本地高价值词库
];

// 招聘相关关键词正则
const JOB_KEYWORDS_REGEX =
  /job|hiring|career|interview|resume|salary|recruit|offer|layoff|firing|engineer|manager|developer|programmer|designer|analyst|校招|春招|秋招|面试|简历|求职|招聘|薪资|大厂|裁员|算法|工程师|产品经理|程序员|设计师|数据分析师|运营|remote|web3|ai/i;

export interface ClassificationResult {
  category: "PRIMARY" | "TRAFFIC" | "JUNK" | "HOLD";
  intent: "INFORMATIONAL" | "NAVIGATIONAL" | "TRANSACTIONAL" | "UNKNOWN";
  searchVolumeEstimate: "LOW" | "MEDIUM" | "HIGH";
  competition: "LOW" | "MEDIUM" | "HIGH";
  contentRecommendation: string;
  reasoning: string;
}

type AdapterResult<T> = 
  | { success: true; data: T; name: string }
  | { success: false; error: string; name: string };

async function fetchWithTimeout<T>(
  adapter: { name: string; fetch(): Promise<T> },
  timeoutMs: number
): Promise<AdapterResult<T>> {
  const startTime = Date.now();
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    const data = await Promise.race([adapter.fetch(), timeoutPromise]);
    const elapsed = Date.now() - startTime;
    console.log(`[keyword-monitor] ✓ ${adapter.name} 完成 (${elapsed}ms)`);
    return { success: true, data, name: adapter.name };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[keyword-monitor] ✗ ${adapter.name} 失败 (${elapsed}ms): ${(err as Error).message}`);
    return { success: false, error: (err as Error).message, name: adapter.name };
  }
}

export async function collectKeywords(): Promise<{
  inserted: number;
  duplicates: number;
  errors: number;
  newIds: string[];
  stats: { adapter: string; count: number; status: string }[];
}> {
  const startTime = Date.now();
  console.log(`[keyword-monitor] 启动 ${ADAPTERS.length} 个适配器采集...`);

  const results = await Promise.all(
    ADAPTERS.map(adapter => fetchWithTimeout(adapter, 15000))
  );

  let allItems: RawKeywordItem[] = [];
  const adapterStats: { adapter: string; count: number; status: string }[] = [];

  for (const result of results) {
    if (result.success) {
      const items = result.data as RawKeywordItem[];
      allItems = allItems.concat(items);
      adapterStats.push({ adapter: result.name, count: items.length, status: "ok" });
    } else {
      adapterStats.push({ adapter: result.name, count: 0, status: `error: ${result.error}` });
    }
  }

  // 过滤
  const beforeFilter = allItems.length;
  allItems = allItems.filter((item) => JOB_KEYWORDS_REGEX.test(item.keyword));

  // 去重
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

  const entries = Array.from(uniqueMap.entries());
  for (const [norm, item] of entries) {
    try {
      const exists = await prisma.keyword_monitors.findFirst({ where: { normalized: norm } });

      if (exists) {
        await prisma.keyword_monitors.update({
          where: { id: exists.id },
          data: {
            lastSeenAt: new Date(),
            trendScore: Math.max(exists.trendScore, item.trendScore || 0),
            source: item.source || exists.source,
          },
        });
        duplicates++;
      } else {
        const classification = fallbackClassify(item.keyword);
        const created = await prisma.keyword_monitors.create({
          data: {
            keyword: item.keyword,
            normalized: norm,
            source: item.source || "unknown",
            trendScore: item.trendScore || 50,
            hotLevel: scoreToHotLevel(item.trendScore || 50),
            category: classification.category,
            intent: classification.intent,
            status: "PENDING",
            lastSeenAt: new Date(),
          },
        });
        newIds.push(created.id);
        inserted++;
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        duplicates++;
      } else {
        errors++;
        console.error(`[keyword-monitor] Error processing ${norm}:`, err.message);
      }
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[keyword-monitor] 完成: 新增${inserted}, 重复${duplicates}, 错误${errors} (${elapsed}ms)`);
  return { inserted, duplicates, errors, newIds, stats: adapterStats };
}

function scoreToHotLevel(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

export function fallbackClassify(keyword: string): ClassificationResult {
  const k = keyword.toLowerCase();
  if (/招聘|求职|hire|hiring|engineer|manager|developer|analyst|产品经理|程序员/i.test(k)) {
    return { category: "PRIMARY", intent: "TRANSACTIONAL", searchVolumeEstimate: "HIGH", competition: "HIGH", contentRecommendation: "专题页", reasoning: "核心招聘词" };
  }
  if (/面试|简历|salary|career|职场|tips/i.test(k)) {
    return { category: "TRAFFIC", intent: "INFORMATIONAL", searchVolumeEstimate: "MEDIUM", competition: "MEDIUM", contentRecommendation: "博客", reasoning: "职场资讯" };
  }
  return { category: "HOLD", intent: "UNKNOWN", searchVolumeEstimate: "LOW", competition: "LOW", contentRecommendation: "不做", reasoning: "无法分类" };
}
