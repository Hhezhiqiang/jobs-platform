import axios from "axios";
import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

export const zhihuAdapter: KeywordSourceAdapter = {
  name: "zhihu",

  async fetch(): Promise<RawKeywordItem[]> {
    const res = await axios.get(
      "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    const list = res.data?.data || [];
    const items: RawKeywordItem[] = [];

    const jobRegex = /面试|求职|招聘|工作|裁员|大厂|薪资|简历|校招|春招|秋招|算法|工程师|产品经理|程序员|职场|offer|跳槽/i;

    for (const entry of list) {
      const title = entry?.target?.title_area?.text || entry?.target?.title;
      if (!title || !jobRegex.test(title)) continue;

      items.push({
        keyword: title as string,
        source: "zhihu",
        sourceUrl: `https://www.zhihu.com/question/${entry?.target?.id}`,
        trendScore: 70 + Math.floor(Math.random() * 20), // 知乎热榜本身没有数字热度，给个区间
        metadata: { hotListIndex: entry?.target?.metrics_area?.text },
      });
    }

    return items;
  },
};
