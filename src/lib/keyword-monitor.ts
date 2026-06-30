import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { normalizeKeyword, type RawKeywordItem } from "./keyword-sources";
import { jobMarketAdapter } from "./keyword-sources/job-market";
import { localHotTopicsAdapter } from "./keyword-sources/local-hot-topics";
import { realTimeHotTopicsAdapter } from "./keyword-sources/realtime-hot-topics";

const ADAPTERS = [
  jobMarketAdapter,
  realTimeHotTopicsAdapter,
  localHotTopicsAdapter,
];

type KeywordMonitorMetadata = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;

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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error), name: adapter.name };
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function toKeywordMonitorMetadata(
  value: RawKeywordItem["metadata"] | KeywordMonitorMetadata
): KeywordMonitorMetadata {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function collectKeywords(): Promise<{
  inserted: number;
  duplicates: number;
  errors: number;
  newIds: string[];
  stats: { adapter: string; count: number; status: string }[];
}> {
  const results = await Promise.all(ADAPTERS.map(adapter => fetchWithTimeout(adapter, 15000)));

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

  const uniqueMap = new Map<string, RawKeywordItem>();
  for (const item of allItems) {
    const norm = normalizeKeyword(item.keyword);
    if (!norm || norm.length < 2) continue;

    const current = uniqueMap.get(norm);
    if (!current || (item.trendScore || 0) > (current.trendScore || 0)) {
      uniqueMap.set(norm, item);
    }
  }

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const newIds: string[] = [];

  for (const [norm, item] of uniqueMap.entries()) {
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
            metadata: toKeywordMonitorMetadata(item.metadata ?? exists.metadata ?? undefined),
          },
        });
        duplicates++;
        continue;
      }

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
          metadata: toKeywordMonitorMetadata(item.metadata ?? {}),
        },
      });

      newIds.push(created.id);
      inserted++;
    } catch (error: unknown) {
      if (isKnownPrismaError(error) && error.code === "P2002") {
        duplicates++;
        continue;
      }

      logger.error("[keyword-monitor] collect error:", getErrorMessage(error));
      errors++;
    }
  }

  return { inserted, duplicates, errors, newIds, stats: adapterStats };
}
