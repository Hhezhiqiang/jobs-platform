import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

// POST /api/stories/[id]/invite - 邀请故事作者投递职位
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 获取故事详情
    const story = await prisma.careerStory.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { error: "故事不存在" },
        { status: 404 }
      );
    }

    // 检查故事是否关联了公司
    if (!story.companyId) {
      return NextResponse.json(
        { error: "该故事没有@任何公司" },
        { status: 400 }
      );
    }

    // 检查用户是否是该公司成员且有权限
    const membership = await prisma.company_members.findFirst({
      where: {
        companyId: story.companyId,
        userId: userId,
        role: { in: ["ADMIN", "RECRUITER"] },
      },
    });

    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "只有公司HR或管理员可以发送内推邀请" },
        { status: 403 }
      );
    }

    const { message } = await req.json();

    // 发送通知给故事作者
    try {
      await prisma.notifications.create({
        data: {
          userId: story.authorId,
          type: "JOB_ALERT",
          title: "收到职位邀请",
          content: `${session.user.name || "某公司HR"} 邀请你投递「${story.company?.name || "该公司"}」的职位`,
          metadata: {
            storyId: story.id,
            companyId: story.companyId,
            companyName: story.company?.name,
            message: message || null,
            invitedBy: userId,
          },
        },
      });
    } catch (notifyError) {
      logger.error("发送通知失败:", notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "内推邀请发送成功",
      story: {
        id: story.id,
        title: story.title,
        author: story.author,
        company: story.company,
      },
    });
  } catch (error) {
    logger.error("发送内推邀请失败:", error);
    return NextResponse.json(
      { error: "发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
