export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';

// 搜索类型
export type SearchType = "jobs" | "companies" | "stories" | "interviews" | "all";

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(ip, 30, 60 * 1000);
  if (!rateLimitResult.success) {
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
  const searchType = (searchParams.get("searchType") as SearchType) || "all";

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
      await prisma.search_queries.upsert({
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
      logger.error("Failed to record search query:", e);
    }
  }

  try {
    const results: any = {};
    let totalCount = 0;

    // 搜索职位
    if (searchType === "all" || searchType === "jobs") {
      const jobWhere: Prisma.jobsWhereInput = {
        status: "ACTIVE",
      };

      if (q) {
        jobWhere.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { requirements: { contains: q, mode: "insensitive" } },
          { benefits: { contains: q, mode: "insensitive" } },
          { companies: { name: { contains: q, mode: "insensitive" } } },
          { companies: { description: { contains: q, mode: "insensitive" } } },
          { location: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ];
      }

      if (city && city !== "all") {
        jobWhere.city = city;
      }

      if (type && type !== "all") {
        jobWhere.employmentType = type as Prisma.EnumEmploymentTypeFilter<"jobs">;
      }

      if (minSalary || maxSalary) {
        const parsedMin = minSalary ? parseInt(minSalary, 10) : null;
        const parsedMax = maxSalary ? parseInt(maxSalary, 10) : null;
        jobWhere.AND = [];
        if (parsedMin !== null && !isNaN(parsedMin)) {
          (jobWhere.AND as Prisma.jobsWhereInput[]).push({
            OR: [
              { salaryMin: { gte: parsedMin } },
              { salaryMax: { gte: parsedMin } },
            ],
          });
        }
        if (parsedMax !== null && !isNaN(parsedMax)) {
          (jobWhere.AND as Prisma.jobsWhereInput[]).push({
            OR: [
              { salaryMin: { lte: parsedMax } },
              { salaryMax: { lte: parsedMax } },
            ],
          });
        }
      }

      const [jobs, jobTotal] = await Promise.all([
        prisma.jobs.findMany({
          where: jobWhere,
          include: {
            companies: {
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
        prisma.jobs.count({ where: jobWhere }),
      ]);

      results.jobs = { items: jobs, total: jobTotal };
      totalCount += jobTotal;
    }

    // 搜索公司
    if (searchType === "all" || searchType === "companies") {
      const companyWhere: Prisma.companiesWhereInput = {};

      if (q) {
        companyWhere.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { industry: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ];
      }

      const [companies, companyTotal] = await Promise.all([
        prisma.companies.findMany({
          where: companyWhere,
          include: {
            _count: {
              select: { jobs: true },
            },
          },
          take: searchType === "all" ? 5 : limit,
          skip: searchType === "all" ? 0 : skip,
        }),
        prisma.companies.count({ where: companyWhere }),
      ]);

      results.companies = { items: companies, total: companyTotal };
      totalCount += companyTotal;
    }

    // 搜索面试经验（职业故事中的INTERVIEW类型）
    if (searchType === "all" || searchType === "interviews") {
      const interviewWhere: Prisma.career_storiesWhereInput = {
        type: "EXPERIENCE",
      };

      if (q) {
        interviewWhere.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ];
      }

      const [interviews, interviewTotal] = await Promise.all([
        prisma.career_stories.findMany({
          where: interviewWhere,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: [
            { resonanceCount: "desc" },
            { createdAt: "desc" },
          ],
          take: searchType === "all" ? 5 : limit,
          skip: searchType === "all" ? 0 : skip,
        }),
        prisma.career_stories.count({ where: interviewWhere }),
      ]);

      // 解析面试经验内容
      const formattedInterviews = interviews.map((story) => {
        const parsedData = parseInterviewContent(story.content);
        return {
          ...story,
          ...parsedData,
        };
      });

      results.interviews = { items: formattedInterviews, total: interviewTotal };
      totalCount += interviewTotal;
    }

    return NextResponse.json({
      ...results,
      totalCount,
      page,
      limit,
      query: q,
      searchType,
    });
  } catch (error) {
    logger.error("Search error:", error);
    return NextResponse.json(
      { error: "搜索失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * 解析面试故事内容
 */
function parseInterviewContent(content: string) {
  const result: any = {};

  result.summary = content.slice(0, 150).trim();
  if (content.length > 150) result.summary += "...";

  // 匹配部门
  const departmentMatch = content.match(/部门[：:]\s*(.+?)(?:\n|$)/i);
  if (departmentMatch) result.department = departmentMatch[1].trim();

  // 匹配岗位
  const positionMatch = content.match(/(?:岗位|职位)[：:]\s*(.+?)(?:\n|$)/i);
  if (positionMatch) result.position = positionMatch[1].trim();

  // 匹配面试结果
  if (/面试通过|拿到offer|成功入职|已通过|录取/i.test(content)) {
    result.result = "passed";
  } else if (/面试未通过|没通过|被拒|失败|未录取/i.test(content)) {
    result.result = "failed";
  } else {
    result.result = "unknown";
  }

  // 匹配难度
  if (/非常难|很难|难度高/i.test(content)) result.difficulty = 5;
  else if (/比较难|有难度/i.test(content)) result.difficulty = 4;
  else if (/中等难度|一般/i.test(content)) result.difficulty = 3;
  else if (/比较简单|不太难/i.test(content)) result.difficulty = 2;
  else if (/很简单|非常容易/i.test(content)) result.difficulty = 1;

  // 提取问题
  const questionMatches = content.match(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*(.+?)(?=\n|$)/gi);
  if (questionMatches) {
    result.questions = questionMatches
      .map((q) => q.replace(/(?:^|\n)(?:\d+[.．、]|Q\d*[：:]?|问题[\d]*[：:]?)\s*/, "").trim())
      .filter((q) => q.length > 5 && q.length < 200)
      .slice(0, 5);
  }

  return result;
}
