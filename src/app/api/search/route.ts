import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

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

  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const minSalary = searchParams.get("minSalary");
  const maxSalary = searchParams.get("maxSalary");
  const pageRaw = searchParams.get("page") || "1";
  const limitRaw = searchParams.get("limit") || "20";

  const pageParsed = parseInt(pageRaw, 10);
  if (isNaN(pageParsed)) {
    return NextResponse.json({ error: "无效参数" }, { status: 400 });
  }
  const page = pageParsed;

  const limitParsed = parseInt(limitRaw, 10);
  if (isNaN(limitParsed)) {
    return NextResponse.json({ error: "无效参数" }, { status: 400 });
  }
  const limit = Math.min(limitParsed, 50);
  const skip = (page - 1) * limit;

  // 记录搜索查询（用于热门搜索统计）
  if (q && q.length > 0) {
    try {
      await prisma.searchQuery.upsert({
        where: { query: q.toLowerCase() },
        update: {
          count: { increment: 1 },
          lastSearched: new Date(),
        },
        create: {
          query: q.toLowerCase(),
          count: 1,
        },
      });
    } catch (e) {
      // 忽略统计错误，不影响搜索功能
      console.error("Failed to record search query:", e);
    }
  }

  try {
    // 构建查询条件
    const where: Prisma.JobWhereInput = {
      status: "ACTIVE",
    };

    // 全文搜索条件
    if (q) {
      // 使用 PostgreSQL 全文搜索（中文支持）
      // 搜索范围：职位标题、描述、公司名、地点
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { requirements: { contains: q, mode: "insensitive" } },
        { benefits: { contains: q, mode: "insensitive" } },
        { company: { name: { contains: q, mode: "insensitive" } } },
        { company: { description: { contains: q, mode: "insensitive" } } },
        { location: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    // 筛选条件
    if (city && city !== "all") {
      where.city = city;
    }

    if (type && type !== "all") {
      where.employmentType = type as Prisma.EnumEmploymentTypeFilter<"Job">;
    }

    if (minSalary || maxSalary) {
      const parsedMin = minSalary ? parseInt(minSalary, 10) : null;
      if (parsedMin !== null && isNaN(parsedMin)) {
        return NextResponse.json({ error: "无效参数" }, { status: 400 });
      }
      const parsedMax = maxSalary ? parseInt(maxSalary, 10) : null;
      if (parsedMax !== null && isNaN(parsedMax)) {
        return NextResponse.json({ error: "无效参数" }, { status: 400 });
      }
      where.AND = [];
      if (parsedMin !== null) {
        (where.AND as Prisma.JobWhereInput[]).push({
          OR: [
            { salaryMin: { gte: parsedMin } },
            { salaryMax: { gte: parsedMin } },
          ],
        });
      }
      if (parsedMax !== null) {
        (where.AND as Prisma.JobWhereInput[]).push({
          OR: [
            { salaryMin: { lte: parsedMax } },
            { salaryMax: { lte: parsedMax } },
          ],
        });
      }
    }

    // 并行执行查询
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { datePosted: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      query: q,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "搜索失败，请稍后重试" },
      { status: 500 }
    );
  }
}
