import googleTrends from "google-trends-api";
import type { KeywordSourceAdapter, RawKeywordItem } from "./index";
import { logger } from '@/lib/logger';

const SEED_TERMS = ["jobs", "hiring", "software engineer", "data scientist", "product manager", "remote jobs"];
const GEO = "US";

export const googleTrendsAdapter: KeywordSourceAdapter = {
  name: "google_trends",

  async fetch(): Promise<RawKeywordItem[]> {
    const items: RawKeywordItem[] = [];

    for (const term of SEED_TERMS) {
      try {
        const result = await googleTrends.relatedQueries({
          keyword: term,
          geo: GEO,
          hl: "en-US",
        });

        const parsed = JSON.parse(result);
        const queries =
          parsed?.default?.rankedList?.[0]?.rankedKeyword ||
          parsed?.default?.rankedList?.[1]?.rankedKeyword ||
          [];

        for (const q of queries.slice(0, 10)) {
          if (!q.query) continue;
          items.push({
            keyword: q.query as string,
            source: "google_trends",
            trendScore: q.value ? Number(q.value) : 50,
            metadata: { seed: term, geo: GEO },
          });
        }
      } catch (err) {
        logger.error(`[google-trends] failed for term "${term}":`, (err as Error).message);
      }
    }

    // Also fetch daily trends as a backup
    try {
      const daily = await googleTrends.dailyTrends({ geo: GEO });
      const parsedDaily = JSON.parse(daily);
      const trendStories = parsedDaily?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
      for (const story of trendStories.slice(0, 10)) {
        const title = story?.title?.query as string | undefined;
        if (!title) continue;
        items.push({
          keyword: title,
          source: "google_trends_daily",
          trendScore: 80,
          metadata: { type: "daily" },
        });
      }
    } catch (err) {
      logger.error("[google-trends] daily trends failed:", (err as Error).message);
    }

    return items;
  },
};
