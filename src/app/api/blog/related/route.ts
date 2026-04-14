import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 获取相关博客
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const keywords = searchParams.get("keywords")?.split(",").filter(Boolean) || [];
    const limit = parseInt(searchParams.get("limit") || "4", 10);

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // 获取当前博客
    const currentBlog = await prisma.pages.findUnique({
      where: { slug },
      select: { category: true, keywords: true },
    });

    if (!currentBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // 合并关键词进行搜索
    const allKeywords = [
      ...(currentBlog.keywords || []),
      ...keywords,
    ].filter(Boolean);

    // 查找相关博客（基于相同分类或关键词）
    const relatedBlogs = await prisma.pages.findMany({
      where: {
        type: "BLOG",
        status: "PUBLISHED",
        slug: { not: slug },
        OR: [
          { category: currentBlog.category },
          ...(allKeywords.length > 0
            ? [
                {
                  keywords: {
                    hasSome: allKeywords,
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { viewCount: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        viewCount: true,
        featuredImage: true,
      },
    });

    // 如果相关博客不够，补充最新博客
    if (relatedBlogs.length < limit) {
      const excludeSlugs = [slug, ...relatedBlogs.map((b) => b.slug)];
      const additionalBlogs = await prisma.pages.findMany({
        where: {
          type: "BLOG",
          status: "PUBLISHED",
          slug: { notIn: excludeSlugs },
        },
        orderBy: { createdAt: "desc" },
        take: limit - relatedBlogs.length,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          viewCount: true,
          featuredImage: true,
        },
      });
      relatedBlogs.push(...additionalBlogs);
    }

    return NextResponse.json({ blogs: relatedBlogs });
  } catch (error) {
    console.error("Failed to fetch related blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch related blogs" },
      { status: 500 }
    );
  }
}
