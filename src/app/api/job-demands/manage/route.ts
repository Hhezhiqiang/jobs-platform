import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// GET /api/job-demands/manage - 获取用户的求职需求列表（用于管理）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const demands = await prisma.jobDemand.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: demands });
  } catch (error: any) {
    logger.error("Get user job demands error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}

// PUT /api/job-demands/manage/[id] - 更新求职需求
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    // 验证所有权
    const existing = await prisma.jobDemand.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const demand = await prisma.jobDemand.update({
      where: { id },
      data: {
        title: body.title,
        salaryMin: body.salaryMin !== undefined ? body.salaryMin : null,
        salaryMax: body.salaryMax !== undefined ? body.salaryMax : null,
        currency: body.currency,
        location: body.location,
        tags: body.tags,
        bio: body.bio,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, data: demand });
  } catch (error: any) {
    logger.error("Update job demand error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/job-demands/manage/[id] - 删除求职需求
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    // 验证所有权
    const existing = await prisma.jobDemand.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.jobDemand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error: any) {
    logger.error("Delete job demand error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
