import { prisma } from "@/lib/prisma";
import { llmChat, isLLMConfigured } from "@/lib/llm";
import type { ClassificationResult } from "./keyword-monitor";

export interface SEOPlanPayload {
  pageType: "BLOG" | "TOPIC" | "FAQ";
  title: string;
  h1: string;
  metaDesc: string;
  keywords: string[];
  outline: Array<{ section: string; points: string[] }>;
  targetUrl: string;
  internalLinks: Array<{ text: string; url: string }>;
}

export async function generateSEOPlan(
  monitorId: string,
  classification?: ClassificationResult
): Promise<SEOPlanPayload> {
  const monitor = await prisma.keywordMonitor.findUnique({
    where: { id: monitorId },
    include: { archives: true },
  });

  if (!monitor) throw new Error("Monitor not found");

  const category = classification?.category || monitor.category;
  const keyword = monitor.keyword;

  // Build context from archives + internal db hints
  const archiveContext = monitor.archives
    .slice(0, 5)
    .map((a) => `[${a.contentType}] ${a.contentTitle || ""}: ${a.contentBody.slice(0, 300)}`)
    .join("\n---\n");

  // If PRIMARY, fetch a tiny sample of related jobs to enrich prompt
  let jobContext = "";
  if (category === "PRIMARY") {
    const relatedJobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { keywords: { hasSome: [keyword] } },
        ],
      },
      take: 5,
      select: { title: true, city: true, salaryMin: true, salaryMax: true },
    });
    if (relatedJobs.length > 0) {
      jobContext =
        "平台现有相关职位示例:\n" +
        relatedJobs
          .map((j) => `- ${j.title} (${j.city || "多地"}) ${j.salaryMin || 0}-${j.salaryMax || 0}K`)
          .join("\n");
    }
  }

  const systemPrompt = `你是一位资深 SEO 内容策略师，为招聘平台设计高转化页面方案。只输出合法 JSON，不要 markdown 代码块。`;

  const userPrompt = `关键词: "${keyword}"
商业价值分类: ${category}
搜索意图: ${classification?.intent || monitor.intent}

${archiveContext ? `素材摘要:\n${archiveContext}\n` : ""}
${jobContext ? `${jobContext}\n` : ""}

请基于以上信息，输出以下 JSON 结构（不要任何额外文字）：
{
  "pageType": "BLOG" | "TOPIC" | "FAQ",
  "title": "SEO标题（30字以内，含关键词）",
  "h1": "页面H1（简洁有力）",
  "metaDesc": "Meta描述（80字以内）",
  "keywords": ["相关词1", "相关词2", "相关词3"],
  "outline": [
    { "section": "一级标题", "points": ["要点1", "要点2"] }
  ],
  "targetUrl": "建议的URL路径，如 /blog/xxx 或 /topics/xxx",
  "internalLinks": [
    { "text": "链接文案", "url": "/jobs?keyword=xxx" }
  ]
}

注意：
- 如果是 PRIMARY 类，优先选 "TOPIC" 类型，目标URL以 /topics/ 开头，底部要有职位列表
- 如果是 TRAFFIC 类，优先选 "BLOG" 类型，目标URL以 /blog/ 开头
- internalLinks 至少给出 2 条平台内链（如 /jobs、/salary-insights、/topics/xxx）`;

  let content: string;
  if (isLLMConfigured()) {
    content = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 1500 }
    );
  } else {
    content = fallbackSEOPayload(keyword, category);
  }

  const jsonText = content.replace(/```json|```/g, "").trim();
  let parsed: SEOPlanPayload;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("[seo-plan] LLM returned invalid JSON:", jsonText);
    parsed = JSON.parse(fallbackSEOPayload(keyword, category));
  }

  // Persist
  await prisma.sEOPlan.create({
    data: {
      monitorId,
      pageType: parsed.pageType,
      title: parsed.title,
      h1: parsed.h1,
      metaDesc: parsed.metaDesc,
      keywords: parsed.keywords,
      outline: parsed.outline as any,
      targetUrl: parsed.targetUrl,
      internalLinks: parsed.internalLinks as any,
      status: "PENDING",
      generatedBy: isLLMConfigured() ? "llm" : "fallback",
    },
  });

  return parsed;
}

function fallbackSEOPayload(keyword: string, category: string): string {
  if (category === "PRIMARY") {
    return JSON.stringify({
      pageType: "TOPIC",
      title: `${keyword} | 高薪岗位精选 | 招聘平台`,
      h1: `${keyword}专题`,
      metaDesc: `汇集最新的${keyword}信息，实时更新热门企业与薪资待遇，助你快速找到理想工作。`,
      keywords: [keyword, "招聘", "求职", "高薪岗位"],
      outline: [
        { section: "市场趋势", points: ["当前${keyword}供需分析", "薪资水平与增长趋势"] },
        { section: "热门职位推荐", points: ["精选20个最新岗位", "覆盖一线与新一线城市"] },
        { section: "技能要求与求职建议", points: ["核心技能清单", "简历优化与面试技巧"] },
      ],
      targetUrl: `/topics/${keyword.replace(/\s+/g, "-").toLowerCase()}`,
      internalLinks: [
        { text: "查看更多职位", url: `/jobs?keyword=${encodeURIComponent(keyword)}` },
        { text: "薪资洞察", url: "/salary-insights" },
      ],
    });
  }
  return JSON.stringify({
    pageType: "BLOG",
    title: `${keyword}：职场人必读的深度解析`,
    h1: keyword,
    metaDesc: `深入解析${keyword}，从数据趋势到实战建议，为求职者提供有价值的参考。`,
    keywords: [keyword, "职场", "求职", "面试"],
    outline: [
      { section: "背景与现状", points: ["行业数据", "关键变化"] },
      { section: "深度分析", points: ["原因剖析", "影响范围"] },
      { section: "对求职者的建议", points: ["如何准备", "机会与风险"] },
    ],
    targetUrl: `/blog/${keyword.replace(/\s+/g, "-").toLowerCase()}`,
    internalLinks: [
      { text: "搜索相关职位", url: `/jobs?keyword=${encodeURIComponent(keyword)}` },
      { text: "热门专题", url: "/topics" },
    ],
  });
}
