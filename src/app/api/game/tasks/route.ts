export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const profile = await prisma.user_game_profiles.findUnique({
      where: { userId: session.user.id },
      include: {
        task_progress: {
          include: {
            task_definitions: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "游戏档案不存在" }, { status: 404 });
    }

    // 分类任务
    const tasks = {
      guide: profile.task_progress.filter(t => t.task_definitions.category === "GUIDE"),
      daily: profile.task_progress.filter(t => t.task_definitions.category === "DAILY"),
      achievement: profile.task_progress.filter(t => t.task_definitions.category === "ACHIEVEMENT"),
    };

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    logger.error("获取任务列表失败:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}
