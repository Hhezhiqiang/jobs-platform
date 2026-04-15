import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const profile = await prisma.userGameProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        taskProgress: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "游戏档案不存在" }, { status: 404 });
    }

    // 分类任务
    const tasks = {
      guide: profile.taskProgress.filter(t => t.task.category === "GUIDE"),
      daily: profile.taskProgress.filter(t => t.task.category === "DAILY"),
      achievement: profile.taskProgress.filter(t => t.task.category === "ACHIEVEMENT"),
    };

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}
