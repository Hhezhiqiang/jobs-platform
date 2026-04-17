/**
 * KIMI 自动博客内容生成器
 * 每个关键词 → 调用 KIMI 生成 2000-3000 字深度专业文章 → 自动发布
 */

import { prisma } from "@/lib/prisma";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
const KIMI_MODEL = process.env.KIMI_MODEL || "moonshot-v1-32k";

interface BlogGenerationResult {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
}

/**
 * 构建 AI 提示词 — 让 KIMI 生成深度专业内容
 */
function buildPrompt(keyword: string, archives: string[], intent: string): string {
  const archiveContext = archives.length > 0
    ? `以下是关于"${keyword}"的最新行业动态和背景资料：\n${archives.slice(0, 5).join("\n\n")}`
    : `请围绕"${keyword}"这个关键词，撰写一篇专业深度的求职/职场类博客文章。`;

  return `你是一位资深的职场内容专家，拥有 10 年以上招聘、职业发展、行业分析经验。请为"JobQuip 招聘平台"撰写一篇关于"${keyword}"的深度专业博客文章。

${archiveContext}

写作要求：
1. **深度原创**：不要模板化套话，要有真实行业洞察、数据支撑和案例分析
2. **结构清晰**：使用 Markdown 格式，包含 H2/H3 标题层级
3. **内容丰富**：至少包含以下板块：
   - 行业现状分析（引用具体数据或趋势）
   - 核心技能要求（针对该领域）
   - 薪资水平参考（给出具体范围）
   - 求职建议/职业发展路径
   - 总结展望
4. **SEO 优化**：自然融入关键词"${keyword}"及相关长尾词，不要堆砌
5. **可读性强**：段落简洁（3-5行一段），用列表和加粗突出重点
6. **字数**：2000-3000 字（中文字符）
7. **开头写一个吸引人的引言**（100字以内，激发读者兴趣）

请直接输出文章正文，不要有任何前言或后记。使用 Markdown 格式。`;
}

/**
 * 调用 KIMI API 生成博客内容
 */
async function callKIMI(prompt: string): Promise<string> {
  if (!KIMI_API_KEY) {
    throw new Error("KIMI_API_KEY not configured");
  }

  const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是 JobQuip 招聘平台的资深内容专家，擅长撰写深度、专业、有洞察力的职场/招聘/职业发展类文章。你的文章数据驱动、案例丰富、建议可操作。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KIMI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("KIMI API returned empty content");
  }

  return content;
}

/**
 * 从内容中提取标题（如果 AI 以 H1 开头）
 */
function extractTitleAndContent(content: string): { title: string; content: string } {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return {
      title: h1Match[1].trim(),
      content: content.replace(/^#\s+.+$/m, "").trim(),
    };
  }
  return { title: "", content };
}

/**
 * 为关键词生成并发布博客文章
 */
export async function generateAndPublishBlog(
  monitorId: string,
  authorId: string
): Promise<{ success: boolean; url?: string; title?: string; error?: string }> {
  try {
    // 1. 获取关键词信息
    const monitor = await prisma.keyword_monitors.findUnique({
      where: { id: monitorId },
      include: {
        keyword_archives: {
          select: { contentBody: true, contentTitle: true },
          take: 10,
        },
        seo_plans: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!monitor) {
      return { success: false, error: "Monitor not found" };
    }

    // 2. 检查是否已有博客文章（避免重复）
    const existingBlog = await prisma.pages.findFirst({
      where: {
        type: "BLOG",
        slug: { contains: monitor.normalized || monitor.keyword },
      },
    });

    if (existingBlog) {
      return { success: true, url: `/blog/${existingBlog.slug}`, title: existingBlog.title };
    }

    // 3. 构建素材上下文
    const archives = monitor.keyword_archives.map(
      (a) => a.contentTitle ? `## ${a.contentTitle}\n${a.contentBody}` : a.contentBody
    );

    // 4. 调用 KIMI 生成内容
    const prompt = buildPrompt(monitor.keyword, archives, monitor.intent);
    const content = await callKIMI(prompt);

    // 5. 提取标题和内容
    const { title: extractedTitle, content: cleanContent } = extractTitleAndContent(content);
    const title = extractedTitle || `${monitor.keyword}：深度解析与求职指南`;

    // 6. 生成 slug
    const slugBase = monitor.normalized
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);
    const slug = `${slugBase}-${Date.now()}`;

    // 7. 生成摘要
    const excerpt = cleanContent
      .replace(/[#*>_`\-]/g, "")
      .substring(0, 160)
      .trim() + "...";

    // 8. 关键词
    const keywords = [monitor.keyword, monitor.category, monitor.intent].filter(Boolean);

    // 9. 发布到数据库
    const blog = await prisma.pages.create({
      data: {
        title,
        slug,
        content: cleanContent,
        excerpt,
        type: "BLOG",
        status: "PUBLISHED",
        authorId,
        metaTitle: `${title} | JobQuip`,
        metaDescription: excerpt,
        keywords,
      },
    });

    return {
      success: true,
      url: `/blog/${blog.slug}`,
      title: blog.title,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 自动博客发布流水线
 * 每次采集到新的 PRIMARY 关键词时，自动生成并发布深度博客
 */
export async function runAutoBlogPipeline(newMonitorIds: string[]): Promise<{
  processed: number;
  published: number;
  errors: number;
  details: Array<{ keyword: string; success: boolean; title?: string; url?: string; error?: string }>;
}> {
  if (!KIMI_API_KEY || newMonitorIds.length === 0) {
    return { processed: 0, published: 0, errors: 0, details: [] };
  }

  // 获取作者
  const adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!adminUser) {
    console.error("[auto-blog] No admin user found");
    return { processed: 0, published: 0, errors: 1, details: [] };
  }

  const result = {
    processed: 0,
    published: 0,
    errors: 0,
    details: [] as Array<{ keyword: string; success: boolean; title?: string; url?: string; error?: string }>,
  };

  for (const monitorId of newMonitorIds) {
    const res = await generateAndPublishBlog(monitorId, adminUser.id);
    result.processed++;

    if (res.success) {
      result.published++;
      result.details.push({
        keyword: (await prisma.keyword_monitors.findUnique({ where: { id: monitorId } }))?.keyword || monitorId,
        success: true,
        title: res.title,
        url: res.url,
      });
      console.log(`[auto-blog] Published: ${res.title} → ${res.url}`);
    } else {
      result.errors++;
      result.details.push({
        keyword: (await prisma.keyword_monitors.findUnique({ where: { id: monitorId } }))?.keyword || monitorId,
        success: false,
        error: res.error,
      });
      console.error(`[auto-blog] Failed for ${monitorId}: ${res.error}`);
    }

    // 避免 API 限流，间隔 2 秒
    if (newMonitorIds.length > 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return result;
}
