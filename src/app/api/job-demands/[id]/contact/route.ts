import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/job-demands/[id]/contact - 企业联系求职者
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    // 验证求职需求存在
    const demand = await prisma.job_demands.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!demand) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    // 不能联系自己
    if (demand.userId === session.user.id) {
      return NextResponse.json({ error: "不能联系自己" }, { status: 400 });
    }

    // 创建联系记录
    const contact = await prisma.job_demand_contacts.create({
      data: {
        id: crypto.randomUUID(),
        demandId: id,
        companyId: session.user.id,
        message: message || null,
        status: "PENDING",
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 创建通知
    await prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId: demand.userId,
        type: "JOB_INTEREST",
        title: "有企业对您感兴趣",
        content: `${session.user.name} 查看了您的求职需求并发送了消息`,
        metadata: {
          demandId: id,
          contactId: contact.id,
          companyId: session.user.id,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: contact,
      message: "联系成功！求职者将收到通知" 
    });
  } catch (error: any) {
    logger.error("Contact job seeker error:", error);
    return NextResponse.json({ error: "联系失败" }, { status: 500 });
  }
}

// GET /api/job-demands/[id]/contacts - 获取联系记录（仅求职者可见）
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 验证求职需求所有权
    const demand = await prisma.job_demands.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!demand || demand.userId !== session.user.id) {
      return NextResponse.json({ error: "无权查看" }, { status: 403 });
    }

    const contacts = await prisma.job_demand_contacts.findMany({
      where: { demandId: id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    logger.error("Get contacts error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}