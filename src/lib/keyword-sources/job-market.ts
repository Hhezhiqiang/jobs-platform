import { prisma } from "@/lib/prisma";
import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

export const jobMarketAdapter: KeywordSourceAdapter = {
  name: "job_market",

  async fetch(): Promise<RawKeywordItem[]> {
    const items: RawKeywordItem[] = [];

    // 1. 热门职位标题词（基于最近发布的职位）
    const recentJobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      orderBy: { viewCount: "desc" },
      take: 20,
      select: { title: true, city: true, keywords: true, viewCount: true },
    });

    const seen = new Set<string>();
    for (const job of recentJobs) {
      const norm = job.title.toLowerCase().trim();
      if (seen.has(norm)) continue;
      seen.add(norm);
      items.push({
        keyword: `${job.title}招聘`,
        source: "job_market",
        trendScore: Math.min((job.viewCount || 0) + 50, 95),
        metadata: { city: job.city, seed: "hot_job_title" },
      });
    }

    // 2. 热门城市+职位组合（如果城市和公司数据允许）
    const cityJobPairs = await prisma.job.findMany({
      where: { status: "ACTIVE", city: { not: "" } },
      orderBy: { viewCount: "desc" },
      take: 15,
      select: { title: true, city: true, viewCount: true },
    });

    for (const j of cityJobPairs) {
      const key = `${j.city}${j.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        keyword: `${j.city}${j.title}招聘`,
        source: "job_market",
        trendScore: Math.min((j.viewCount || 0) + 45, 90),
        metadata: { city: j.city, seed: "city_job_pair" },
      });
    }

    // 3. 从职位关键词标签提取
    for (const job of recentJobs) {
      for (const kw of job.keywords || []) {
        const norm = kw.toLowerCase().trim();
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        items.push({
          keyword: `${kw}面试攻略`,
          source: "job_market",
          trendScore: 65,
          metadata: { seed: "job_keyword" },
        });
      }
    }

    // 4.  evergreen 内容种子
    const evergreen = [
      "2026薪资谈判技巧",
      "大厂面试流程解析",
      "35岁程序员职业转型",
      "远程工作求职指南",
      "产品经理面试高频题",
      "数据分析师成长路线",
      "前端工程师简历优化",
      "Java后端面试攻略",
      "AI时代求职者必备技能",
      "校招春招秋招时间线",
    ];
    for (const kw of evergreen) {
      const norm = kw.toLowerCase().trim();
      if (seen.has(norm)) continue;
      seen.add(norm);
      items.push({
        keyword: kw,
        source: "job_market",
        trendScore: 55 + Math.floor(Math.random() * 15),
        metadata: { seed: "evergreen" },
      });
    }

    return items;
  },
};
