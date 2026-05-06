export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

// 获取热门搜索词
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const days = parseInt(searchParams.get("days") || "30");

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const hotQueries = await prisma.search_queries.findMany({
      where: {
        lastSearched: {
          gte: since,
        },
      },
      orderBy: [
        { count: "desc" },
        { lastSearched: "desc" },
      ],
      select: {
        query: true,
        count: true,
      },
      take: limit,
    });

    return NextResponse.json({
      hotQueries: hotQueries.map((q) => ({
        term: q.query,
        count: q.count,
      })),
    });
  } catch (error) {
    logger.error("Hot queries error:", error);
    return NextResponse.json({ hotQueries: [] });
  }
}
