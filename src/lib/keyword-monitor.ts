import { prisma } from "@/lib/prisma";
import { normalizeKeyword, type RawKeywordItem } from "./keyword-sources";
import { googleTrendsAdapter } from "./keyword-sources/google-trends";
import { zhihuAdapter } from "./keyword-sources/zhihu";
import { redditAdapter } from "./keyword-sources/reddit";
import { jobMarketAdapter } from "./keyword-sources/job-market";
import { weiboAdapter } from "./keyword-sources/weibo";
import { baiduTrendsAdapter } from "./keyword-sources/baidu-trends";

const ADAPTERS = [
  jobMarketAdapter,      // 本地数据库，最可靠
  googleTrendsAdapter,   // Google Trends
  zhihuAdapter,          // 知乎
  redditAdapter,         // Reddit
  weiboAdapter,          // 微博
  baiduTrendsAdapter,    // 百度指数
];

// 每个适配器的超时时间（毫秒）
const ADAPTER_TIMEOUT = 15000;

// 招聘相关关键词正则（快速预过滤）
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

// 适配器结果类型
type AdapterResult<T> = 
  | { success: true; data: T; name: string }
  | { success: false; error: string; name: string };

// 带超时的适配器调用
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
    const errorMsg = (err as Error).message;
    console.error(`[keyword-monitor] ✗ ${adapter.name} 失败 (${elapsed}ms): ${errorMsg}`);
    return { success: false, error: errorMsg, name: adapter.name };
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

  // 并行获取所有数据源（带超时）
  const results = await Promise.all(
    ADAPTERS.map(adapter => fetchWithTimeout(adapter, ADAPTER_TIMEOUT))
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

  console.log(`[keyword-monitor] 原始数据: ${allItems.length} 条，来自 ${results.filter(r => r.success).length}/${ADAPTERS.length} 个适配器`);

  // 快速预过滤
  const beforeFilter = allItems.length;
  allItems = allItems.filter((item) => JOB_KEYWORDS_REGEX.test(item.keyword));
  console.log(`[keyword-monitor] 预过滤后: ${allItems.length}/${beforeFilter} 条（排除非招聘相关）`);

  // 按标准化关键词去重
  const uniqueMap = new Map<string, RawKeywordItem>();
  for (const item of allItems) {
    const norm = normalizeKeyword(item.keyword);
    if (!norm) continue;
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, item);
    }
  }

  console.log(`[keyword-monitor] 去重后: ${uniqueMap.size} 个唯一关键词`);

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const newIds: string[] = [];

  // 批量处理，每 10 个一组
  const entries = Array.from(uniqueMap.entries());
  const batchSize = 10;
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async ([norm, item]) => {
        try {
          const exists = await prisma.keyword_monitors.findFirst({
            where: { normalized: norm },
          });

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
            return;
          }

          // 使用规则分类（更快，无需 LLM）
          const classification = fallbackClassify(item.keyword);

          // 定义元数据类型
          type KeywordMetadata = {
            description?: string;
            related?: string[];
            category?: string;
          };

          const metadata: KeywordMetadata = item.metadata || {};

          const created = await prisma.keyword_monitors.create({
            data: {
              keyword: item.keyword,
              normalized: norm,
              source: item.source || "unknown",
              sourceUrl: item.sourceUrl || null,
              trendScore: item.trendScore || 50,
              hotLevel: scoreToHotLevel(item.trendScore || 50),
              category: classification.category as string,
              intent: classification.intent as string,
              status: "PENDING" as string,
              lastSeenAt: new Date(),
              metadata: metadata as any,
            },
          });
          newIds.push(created.id);
          inserted++;
        } catch (err: unknown) {
          const error = err as { code?: string; message?: string };
          if (error.code === "P2002") {
            // 竞态条件：另一个实例创建了相同的关键词
            try {
              const exists = await prisma.keyword_monitors.findFirst({
                where: { normalized: norm },
              });
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
                errors++;
              }
            } catch {
              errors++;
            }
          } else {
            console.error(`[keyword-monitor] 处理 "${norm}" 失败:`, error.message || String(error));
            errors++;
          }
        }
      })
    );
  }

  const elapsed = Date.now() - startTime;
  console.log(`[keyword-monitor] 处理完成: 新增${inserted}, 重复${duplicates}, 错误${errors} (${elapsed}ms)`);

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
  
  // PRIMARY: 直接招聘相关
  if (
    /招聘|求职|hire|hiring|jobs?\s*near\s*me|software\s*engineer|data\s*scientist|product\s*manager|前端|后端|算法|工程师/i.test(k)
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
  
  // TRAFFIC: 与职场相关但转化弱
  if (/面试|简历|salary|offer|裁员|出路|职场|career\s*advice|interview\s*tips|resume/i.test(k)) {
    return {
      category: "TRAFFIC",
      intent: "INFORMATIONAL",
      searchVolumeEstimate: "MEDIUM",
      competition: "MEDIUM",
      contentRecommendation: "博客",
      reasoning: "与招聘间接相关，信息型搜索为主，适合内容引流",
    };
  }
  
  // HOLD: 暂时看不清
  return {
    category: "HOLD",
    intent: "UNKNOWN",
    searchVolumeEstimate: "LOW",
    competition: "LOW",
    contentRecommendation: "不做",
    reasoning: "规则引擎无法明确分类，标记为观望",
  };
}
