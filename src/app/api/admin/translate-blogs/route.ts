/**
 * 博客批量翻译脚本
 * 
 * 用法：通过 Vercel 部署后调用
 * curl -X POST https://jobquip.com/api/admin/translate-blogs \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"dryRun": false, "limit": 10}'
 */

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 调用 Kimi API 翻译
async function translateWithKimi(text: string, context: { title: string }): Promise<{ title: string; excerpt: string }> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error("KIMI_API_KEY not set");

  const prompt = `You are a professional translator. Translate the following Chinese blog content into professional English.

Rules:
- Keep the title concise and engaging (SEO-friendly)
- Keep the excerpt under 160 characters (for SEO meta description)
- Maintain the original meaning and tone
- Use natural, professional English
- Do NOT add any extra content or commentary

Chinese Title: ${context.title}
Chinese Content (first 500 chars): ${text.slice(0, 500)}

Return ONLY a JSON object with this format:
{"title": "English title here", "excerpt": "English excerpt here (max 160 chars)"}`;

  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from Kimi API");

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON response: ${content.slice(0, 200)}`);

  const result = JSON.parse(jsonMatch[0]);
  if (!result.title || !result.excerpt) throw new Error("Missing title or excerpt in translation");

  return {
    title: result.title,
    excerpt: result.excerpt.slice(0, 160),
  };
}

// 翻译博客正文（单独调用，因为内容可能很长）
async function translateContent(content: string): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error("KIMI_API_KEY not set");

  const prompt = `Translate the following Chinese blog content into professional English.

Rules:
- Maintain the original formatting (headings, lists, code blocks, etc.)
- Use natural, professional English
- Keep markdown syntax intact
- Do NOT add any extra content or commentary

Chinese Content:
${content.slice(0, 4000)}

Return ONLY the translated English text. Do not wrap it in JSON or any other format.`;

  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-32k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content_en = data.choices?.[0]?.message?.content?.trim();
  if (!content_en) throw new Error("Empty response from Kimi API");

  return content_en;
}

export async function POST(request: NextRequest) {
  // 验证权限
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun !== false; // 默认 dryRun
  const limit = body.limit || 5; // 每次翻译数量，默认 5 篇

  try {
    // 获取需要翻译的博客
    const blogs = await prisma.pages.findMany({
      where: {
        type: "BLOG",
        status: "PUBLISHED",
        OR: [
          { titleEn: null },
          { titleEn: "" },
          { contentEn: null },
          { contentEn: "" },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        titleEn: true,
        excerptEn: true,
        contentEn: true,
      },
      take: limit,
      orderBy: { createdAt: "asc" }, // 从最早的开始翻译
    });

    if (blogs.length === 0) {
      return NextResponse.json({ message: "All blogs already translated!", count: 0 });
    }

    const results: Array<{
      slug: string;
      title: string;
      status: "success" | "error";
      error?: string;
    }> = [];

    for (const blog of blogs) {
      try {
        // Step 1: 翻译标题和摘要（短文本）
        const titleExcerpt = await translateWithKimi(
          blog.excerpt || blog.content.slice(0, 300),
          { title: blog.title }
        );

        // Step 2: 翻译正文（长文本，单独调用）
        const contentEn = await translateContent(blog.content);

        if (!dryRun) {
          // 写入数据库
          await prisma.pages.update({
            where: { id: blog.id },
            data: {
              titleEn: titleExcerpt.title,
              excerptEn: titleExcerpt.excerpt,
              metaTitleEn: titleExcerpt.title,
              metaDescriptionEn: titleExcerpt.excerpt,
              contentEn,
            },
          });
        }

        results.push({
          slug: blog.slug,
          title: titleExcerpt.title,
          status: "success",
        });

        // 避免 API 限流
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        results.push({
          slug: blog.slug,
          title: blog.title,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: dryRun ? "Dry run completed" : "Translation completed",
      dryRun,
      count: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
