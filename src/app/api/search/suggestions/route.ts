export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';

// 获取搜索建议
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip, 5, 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (!q || q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // 1. 从职位标题中匹配
    const jobSuggestions = await prisma.jobs.findMany({
      where: {
        status: "ACTIVE",
        title: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        title: true,
      },
      distinct: ["title"],
      take: 5,
    });

    // 2. 从公司名中匹配
    const companySuggestions = await prisma.companies.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        name: true,
      },
      take: 3,
    });

    // 3. 从搜索历史中匹配热门查询
    const historySuggestions = await prisma.search_queries.findMany({
      where: {
        query: {
          contains: q,
          mode: "insensitive",
        },
      },
      orderBy: {
        count: "desc",
      },
      select: {
        query: true,
      },
      take: 3,
    });

    // 合并并去重
    const suggestions = new Set<string>();

    jobSuggestions.forEach((job) => suggestions.add(job.title));
    companySuggestions.forEach((company) => suggestions.add(company.name));
    historySuggestions.forEach((item) => suggestions.add(item.query));

    return NextResponse.json({
      suggestions: Array.from(suggestions).slice(0, limit),
    });
  } catch (error) {
    logger.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
