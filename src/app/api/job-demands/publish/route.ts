import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// POST /api/job-demands/publish - 一键发布求职需求（从简历）
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { salaryMin, salaryMax, currency, location, title } = body;

  try {
    // 1. 获取用户的默认简历
    const resume = await prisma.resumes.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });

    // 2. 获取用户信息
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      include: { user_profiles: true },
    });

    // 3. 自动填充信息
    const autoTitle = title || `${user?.user_profiles?.skills?.[0] || '工程师'}求职`;
    const autoTags = user?.user_profiles?.skills || [];
    const autoBio = resume ? (resume as any).content || user?.user_profiles?.bio : user?.user_profiles?.bio;

    // 4. 创建求职需求
    const demand = await prisma.jobDemand.create({
      data: {
        userId: session.user.id,
        title: autoTitle,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        currency: currency || "CNY",
        location: location || null,
        tags: autoTags,
        bio: autoBio || null,
        status: "OPEN",
      },
      include: { user: true },
    });

    return NextResponse.json({ 
      success: true, 
      data: demand,
      message: "发布成功！" 
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Publish job demand error:", error);
    return NextResponse.json({ error: "发布失败" }, { status: 500 });
  }
}

// GET /api/job-demands/publish - 获取用户已发布的求职需求
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const demands = await prisma.jobDemand.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return NextResponse.json({ success: true, data: demands });
  } catch (error: any) {
    logger.error("Get job demands error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
