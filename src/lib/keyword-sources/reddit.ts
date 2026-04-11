import axios from "axios";
import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

const SUBREDDITS = ["jobs", "cscareerquestions", "productmanagement", "data science"];

export const redditAdapter: KeywordSourceAdapter = {
  name: "reddit",

  async fetch(): Promise<RawKeywordItem[]> {
    const items: RawKeywordItem[] = [];

    for (const sub of SUBREDDITS) {
      try {
        const res = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
          headers: {
            "User-Agent": "jobs-platform-bot/1.0 (keyword monitoring)",
          },
          timeout: 10000,
        });

        const posts = res.data?.data?.children || [];
        for (const post of posts) {
          const title = post?.data?.title as string | undefined;
          if (!title) continue;
          items.push({
            keyword: title,
            source: "reddit",
            sourceUrl: `https://www.reddit.com${post?.data?.permalink}`,
            trendScore: post?.data?.score ? Math.min(Number(post.data.score), 100) : 50,
            metadata: { subreddit: sub, ups: post?.data?.ups },
          });
        }
      } catch (err) {
        console.error(`[reddit] failed for r/${sub}:`, (err as Error).message);
      }
    }

    return items;
  },
};
