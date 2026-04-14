import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 获取职位列表
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`jobs:get:${ip}`, 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where: { status: "ACTIVE" },
        include: { companies: true },
        orderBy: { datePosted: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建新职位
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    
    // 生成 slug
    const slug = body.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-")
      + "-" + Date.now();

    // 如果没有公司，先创建默认公司
    let companyId = body.companyId;
    if (!companyId) {
      const defaultCompany = await prisma.companies.upsert({
        where: { slug: "default-company" },
        update: {},
        create: {
          name: "默认公司",
          slug: "default-company",
        },
      });
      companyId = defaultCompany.id;
    }

    const job = await prisma.jobs.create({
      data: {
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        benefits: body.benefits,
        employmentType: body.employmentType,
        experience: body.experience,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryCurrency: body.salaryCurrency,
        salaryPeriod: body.salaryPeriod,
        location: body.location,
        city: body.city,
        country: body.country,
        isRemote: body.isRemote,
        isHybrid: body.isHybrid,
        applyUrl: body.applyUrl,
        validThrough: body.validThrough,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords,
        imageUrl: body.imageUrl,
        schemaOrganizationName: body.schemaOrganizationName,
        schemaOrganizationLogo: body.schemaOrganizationLogo,
        slug,
        companyId,
        authorId: session.user.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
