import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/job-demands/[id]/view - 增加浏览次数
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    await prisma.jobDemand.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Increment view count error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// GET /api/job-demands/[id] - 获取求职需求详情
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const demand = await prisma.jobDemand.findUnique({
      where: { id },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            user_profiles: true,
          },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: demand });
  } catch (error: any) {
    console.error("Get job demand error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}

// PUT /api/job-demands/[id] - 更新求职需求
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await import("next-auth/next").then(m => m.getServerSession());
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

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
        salaryMin: body.salaryMin ? parseInt(body.salaryMin) : null,
        salaryMax: body.salaryMax ? parseInt(body.salaryMax) : null,
        currency: body.currency,
        location: body.location,
        tags: body.tags,
        bio: body.bio,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, data: demand });
  } catch (error: any) {
    console.error("Update job demand error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/job-demands/[id] - 删除求职需求
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await import("next-auth/next").then(m => m.getServerSession());
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete job demand error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
