import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// 获取公司列表
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`companies:get:${ip}`, 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    const companies = await prisma.companies.findMany({
      take: 100,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
       
      logger.error("Get companies error:", error);
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建新公司
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();

    // 验证必填字段
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: "公司名称和标识为必填项" },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existingCompany = await prisma.companies.findUnique({
      where: { slug: body.slug },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "该URL标识已被使用，请更换" },
        { status: 400 }
      );
    }

    // 限制每个用户最多创建 3 家公司
    const existingCount = await prisma.companies.count({
      where: {
        company_members: {
          some: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    if (existingCount >= 3) {
      return NextResponse.json(
        { error: "每位用户最多只能创建 3 家公司" },
        { status: 400 }
      );
    }

    const company = await prisma.companies.create({
      data: {
        name: body.name,
        slug: body.slug,
        website: body.website || null,
        industry: body.industry || null,
        size: body.size || null,
        location: body.location || null,
        logo: body.logo || null,
        description: body.description || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        company_members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    logger.error("Create company error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}