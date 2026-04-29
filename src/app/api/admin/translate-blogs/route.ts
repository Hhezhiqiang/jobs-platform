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
import { aiChat, aiChatJSON } from "@/lib/ai-client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 调用 ai-client 翻译标题和摘要
async function translateTitleExcerpt(text: string, context: { title: string }): Promise<{ title: string; excerpt: string }> {
  try {
    const result = await aiChatJSON<{ title: string; excerpt: string }>([
      {
        role: "system",
        content: "You are a professional translator. Translate the following Chinese blog content into professional English. Return ONLY a JSON object with format: {\"title\": \"...\", \"excerpt\": \"...\"}. Keep title concise and SEO-friendly. Keep excerpt under 160 characters.",
      },
      {
        role: "user",
        content: `Chinese Title: ${context.title}\nChinese Content (first 500 chars): ${text.slice(0, 500)}`,
      },
    ], { maxTokens: 500, temperature: 0.3, cacheTTL: 86400 });

    if (!result.title || !result.excerpt) throw new Error("Missing title or excerpt in translation");

    return {
      title: result.title,
      excerpt: result.excerpt.slice(0, 160),
    };
  } catch (error: any) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// 翻译博客正文（单独调用，因为内容可能很长）
async function translateContent(content: string): Promise<string> {
  try {
    const contentEn = await aiChat([
      {
        role: "system",
        content: "你是一个专业的翻译助手。请将中文翻译为英文。保持 Markdown 格式。只返回翻译结果，不要其他内容。",
      },
      {
        role: "user",
        content: content.slice(0, 8000),
      },
    ], { maxTokens: 4000, temperature: 0.3, cacheTTL: 86400 });

    if (!contentEn) throw new Error("Empty translation response");

    return contentEn;
  } catch (error: any) {
    throw new Error(`Content translation failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  // 验证权限：cron 认证 + admin 认证
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // 不是 cron，检查是否是 admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
        const titleExcerpt = await translateTitleExcerpt(
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
