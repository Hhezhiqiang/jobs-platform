import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// 获取热门博客
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const exclude = searchParams.get("exclude"); // 排除当前文章ID

    const blogs = await prisma.pages.findMany({
      where: {
        type: "BLOG",
        status: "PUBLISHED",
        ...(exclude ? { id: { not: exclude } } : {}),
      },
      orderBy: { viewCount: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        featuredImage: true,
      },
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    logger.error("Failed to fetch hot blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch hot blogs" },
      { status: 500 }
    );
  }
}
