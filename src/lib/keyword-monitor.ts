import { prisma } from "@/lib/prisma";
import { normalizeKeyword, type RawKeywordItem } from "./keyword-sources";
import { jobMarketAdapter } from "./keyword-sources/job-market";
import { localHotTopicsAdapter } from "./keyword-sources/local-hot-topics";
// 新增: 实时网络热点
import { realTimeHotTopicsAdapter } from "./keyword-sources/realtime-hot-topics";
import { logger } from '@/lib/logger';

const ADAPTERS = [
  jobMarketAdapter,          // 站内岗位数据（最可靠）
  realTimeHotTopicsAdapter,  // 新增: 百度/知乎/微博实时热点
  localHotTopicsAdapter,     // 高价值关键词库
];

// 关键词超时 & 重试
async function fetchWithTimeout<T>(
  adapter: { name: string; fetch(): Promise<T> },
  timeoutMs: number
): Promise<{ success: boolean; data?: T; error?: string; name: string }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    const data = await Promise.race([adapter.fetch(), timeoutPromise]);
    return { success: true, data, name: adapter.name };
  } catch (err) {
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
  const results = await Promise.all(
    ADAPTERS.map(adapter => fetchWithTimeout(adapter, 15000))
  );

  let allItems: RawKeywordItem[] = [];
  const adapterStats: { adapter: string; count: number; status: string }[] = [];

  for (const result of results) {
    if (result.success && result.data) {
      const items = result.data as RawKeywordItem[];
      allItems = allItems.concat(items);
      adapterStats.push({ adapter: result.name, count: items.length, status: "ok" });
    } else {
      adapterStats.push({ adapter: result.name, count: 0, status: `error: ${result.error}` });
    }
  }

  // 去重
  const uniqueMap = new Map<string, RawKeywordItem>();
  for (const item of allItems) {
    const norm = normalizeKeyword(item.keyword);
    if (!norm || norm.length < 2) continue;
    if (!uniqueMap.has(norm) || (item.trendScore || 0) > (uniqueMap.get(norm)!.trendScore || 0)) {
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
            sourceUrl: item.sourceUrl || exists.sourceUrl,
            metadata: item.metadata || exists.metadata,
          },
        });
        duplicates++;
      } else {
        const created = await prisma.keyword_monitors.create({
          data: {
            keyword: item.keyword.substring(0, 100),
            normalized: norm,
            source: item.source || "unknown",
            sourceUrl: item.sourceUrl,
            trendScore: item.trendScore || 50,
            hotLevel: (item.trendScore || 50) >= 80 ? 3 : (item.trendScore || 50) >= 60 ? 2 : 1,
            category: "HOLD",
            intent: "UNKNOWN",
            status: "PENDING",
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
            metadata: item.metadata || {},
          },
        });
        newIds.push(created.id);
        inserted++;
      }
    } catch (err: any) {
      if (err.code === "P2002") { duplicates++; continue; }
      errors++;
    }
  }

  return { inserted, duplicates, errors, newIds, stats: adapterStats };
}