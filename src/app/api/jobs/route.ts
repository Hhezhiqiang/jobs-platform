import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translateJobContent } from "@/lib/auto-translator";
import { Prisma } from "@prisma/client";

// 计算匹配度
function calculateMatchScore(companyTags: string[], userTags: string[]): number {
  if (!userTags.length || !companyTags.length) return 0;
  
  const matchingTags = companyTags.filter(tag => userTags.includes(tag));
  return Math.round((matchingTags.length / userTags.length) * 100);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const q = searchParams.get("q") || undefined;
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;
    const minSalary = searchParams.get("minSalary") || undefined;
    const maxSalary = searchParams.get("maxSalary") || undefined;
    const cultureTag = searchParams.get("cultureTag") || undefined;
    const onlyMatched = searchParams.get("onlyMatched") === "true";
    const cultureTags = searchParams.getAll("cultureTags"); // 用户偏好标签
    const sort = searchParams.get("sort") || "date";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.jobsWhereInput = { status: "ACTIVE" };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { companies: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (city) {
      where.city = city;
    }

    if (type) {
      where.employmentType = type as Prisma.EnumEmploymentTypeFilter<"jobs">;
    }

    if (minSalary || maxSalary) {
      where.AND = [];
      if (minSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMin: { gte: parseInt(minSalary) },
        });
      }
      if (maxSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMax: { lte: parseInt(maxSalary) },
        });
      }
    }

    if (cultureTag) {
      where.companies = {
        cultureTags: {
          has: cultureTag,
        },
      };
    }

    // 获取职位数据
    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        include: {
          companies: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              industry: true,
              size: true,
              location: true,
              cultureTags: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where }),
    ]);

    // 计算匹配度
    let jobsWithMatchScore = jobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(
        job.companies.cultureTags || [],
        cultureTags
      ),
    }));

    // 只显示文化契合职位（匹配度>=80%）
    if (onlyMatched && cultureTags.length > 0) {
      jobsWithMatchScore = jobsWithMatchScore.filter(job => job.matchScore >= 80);
    }

    // 排序
    if (sort === "match" && cultureTags.length > 0) {
      jobsWithMatchScore.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      jobsWithMatchScore.sort((a, b) => 
        new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
      );
    }

    // 计算文化契合统计
    const cultureFitCount = cultureTags.length > 0
      ? jobsWithMatchScore.filter(job => job.matchScore >= 80).length
      : 0;

    return NextResponse.json({
      jobs: jobsWithMatchScore,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      cultureFitCount,
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST: 创建职位（管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const body = await request.json();
    const slug = `${body.title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, "-")}-${Date.now()}`;

    const job = await prisma.jobs.create({
      data: {
        title: body.title,
        slug,
        description: body.description || "",
        requirements: body.requirements || "",
        benefits: body.benefits || "",
        employmentType: body.employmentType || "FULL_TIME",
        experience: body.experience || "MID",
        salaryMin: body.salaryMin ? parseInt(body.salaryMin, 10) : null,
        salaryMax: body.salaryMax ? parseInt(body.salaryMax, 10) : null,
        location: body.location || "",
        city: body.city || "",
        isRemote: body.isRemote || false,
        isHybrid: body.isHybrid || false,
        applyUrl: body.applyUrl || "",
        companyId: body.companyId,
        authorId: session.user.id,
        status: body.status || "ACTIVE",
        datePosted: new Date(),
      },
    });

    // Auto-translate to English
    try {
      const translated = await translateJobContent(
        job.title,
        job.description || "",
        job.requirements || undefined,
        job.benefits || undefined,
      );
      await prisma.jobs.update({
        where: { id: job.id },
        data: {
          titleEn: translated.titleEn,
          descriptionEn: translated.descriptionEn,
          requirementsEn: translated.requirementsEn,
          benefitsEn: translated.benefitsEn,
        },
      });
      console.log(`[translate] Admin job #${job.id} translated to English`);
    } catch (err) {
      console.error(`[translate] Failed to translate admin job #${job.id}:`, err);
    }

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: error.message || "发布失败" }, { status: 500 });
  }
}
