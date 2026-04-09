import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取职位列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { status: "ACTIVE" },
        include: { company: true },
        orderBy: { datePosted: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where: { status: "ACTIVE" } }),
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
    
    if (!session) {
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
      const defaultCompany = await prisma.company.upsert({
        where: { slug: "default-company" },
        update: {},
        create: {
          name: "默认公司",
          slug: "default-company",
        },
      });
      companyId = defaultCompany.id;
    }

    const job = await prisma.job.create({
      data: {
        ...body,
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
