import { prisma } from "@/lib/prisma";
import { aiChat, isAIConfigured } from "@/lib/ai-client";
import axios from "axios";

export interface ArchiveResult {
  inserted: number;
  errors: number;
}

/**
 * Collect content archives for a keyword monitor from multiple sources.
 */
export async function collectArchives(monitorId: string): Promise<ArchiveResult> {
  const monitor = await prisma.keyword_monitors.findUnique({ where: { id: monitorId } });
  if (!monitor) throw new Error("Monitor not found");

  let inserted = 0;
  let errors = 0;

  const sources = [
    { name: "perplexity", fn: () => fetchPerplexity(monitor.keyword) },
    { name: "zhihu", fn: () => fetchZhihuSearch(monitor.keyword) },
    { name: "reddit", fn: () => fetchRedditSearch(monitor.keyword) },
    { name: "job_data", fn: () => fetchLocalJobData(monitor.keyword) },
  ];

  for (const source of sources) {
    try {
      const archives = await source.fn();
      for (const archive of archives) {
        await prisma.keyword_archives.create({
          data: {
            monitorId,
            contentType: archive.contentType,
            contentUrl: archive.contentUrl,
            contentTitle: archive.contentTitle,
            contentBody: archive.contentBody,
            relevanceScore: archive.relevanceScore,
          },
        });
        inserted++;
      }
    } catch (err) {
      console.error(`[archive-engine] ${source.name} failed:`, (err as Error).message);
      errors++;
    }
  }

  return { inserted, errors };
}

interface RawArchive {
  contentType: string;
  contentUrl?: string;
  contentTitle?: string;
  contentBody: string;
  relevanceScore?: number;
}

async function fetchPerplexity(keyword: string): Promise<RawArchive[]> {
  if (!isAIConfigured()) return [];

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a research assistant. Provide a concise, factual summary with key bullet points. Cite sources if possible.",
    },
    {
      role: "user" as const,
      content: `What is the current trend and key discussion points around "${keyword}" in the job market or tech industry? Please keep it under 300 words.`,
    },
  ];

  try {
    const content = await aiChat(messages, { maxTokens: 2000, temperature: 0.3 });
    if (!content) return [];

    return [
      {
        contentType: "KIMI_QA",
        contentTitle: `Trend analysis: ${keyword}`,
        contentBody: content,
        relevanceScore: 0.9,
      },
    ];
  } catch (err) {
    console.error(`[archive-engine] ai-chat failed:`, (err as Error).message);
    return [];
  }
}

async function fetchZhihuSearch(keyword: string): Promise<RawArchive[]> {
  try {
    const res = await axios.get(
      `https://www.zhihu.com/api/v4/search_v3?q=${encodeURIComponent(keyword)}&t=general`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    const objects = res.data?.data || [];
    const archives: RawArchive[] = [];

    for (const obj of objects.slice(0, 3)) {
      const item = obj?.object || obj;
      const title = item?.title?.replace(/<[^>]+>/g, "") || item?.question?.name;
      const excerpt = item?.excerpt?.replace(/<[^>]+>/g, "") || "";
      const url = item?.url || `https://www.zhihu.com/question/${item?.id}`;
      if (!title && !excerpt) continue;

      archives.push({
        contentType: "ZHIHU_ANSWER",
        contentTitle: title,
        contentBody: excerpt || title,
        contentUrl: url,
        relevanceScore: 0.75,
      });
    }

    return archives;
  } catch (err) {
    console.error("[archive-engine] zhihu search failed:", (err as Error).message);
    return [];
  }
}

async function fetchRedditSearch(keyword: string): Promise<RawArchive[]> {
  try {
    const res = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=top&limit=5`,
      {
        headers: {
          "User-Agent": "jobs-platform-bot/1.0 (keyword monitoring)",
        },
        timeout: 10000,
      }
    );

    // Reddit 帖子数据结构
    interface RedditPost {
      data: {
        title: string;
        selftext: string;
        permalink: string;
      };
    }

    const posts = res.data?.data?.children || [];
    return posts.slice(0, 3).map((post: RedditPost) => ({
      contentType: "REDDIT_POST",
      contentTitle: post?.data?.title,
      contentBody: post?.data?.selftext?.slice(0, 800) || post?.data?.title,
      contentUrl: `https://www.reddit.com${post?.data?.permalink}`,
      relevanceScore: 0.7,
    }));
  } catch (err) {
    console.error("[archive-engine] reddit search failed:", (err as Error).message);
    return [];
  }
}

async function fetchLocalJobData(keyword: string): Promise<RawArchive[]> {
  const relatedJobs = await prisma.jobs.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { keywords: { hasSome: [keyword] } },
        { description: { contains: keyword, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: {
      title: true,
      city: true,
      salaryMin: true,
      salaryMax: true,
      employmentType: true,
      companies: { select: { name: true } },
    },
  });

  if (relatedJobs.length === 0) return [];

  const body = relatedJobs
    .map(
      (j) =>
        `- ${j.title} @ ${j.companies?.name || "未知公司"} (${j.city || "多地"}) ${
          j.salaryMin || 0
        }-${j.salaryMax || 0}K · ${j.employmentType || "全职"}`
    )
    .join("\n");

  return [
    {
      contentType: "JOB_DATA",
      contentTitle: `平台相关职位: ${keyword}`,
      contentBody: body,
      relevanceScore: 0.95,
    },
  ];
}
