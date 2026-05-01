export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addExp } from "@/lib/game/exp-system";

/**
 * 获取任务进度（支持实时更新）
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskCode = searchParams.get("taskCode");

    const profile = await prisma.userGameProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "游戏档案不存在" }, { status: 404 });
    }

    // 如果指定了任务代码，返回单个任务进度
    if (taskCode) {
      const taskDef = await prisma.taskDefinition.findUnique({
        where: { code: taskCode },
      });

      if (!taskDef) {
        return NextResponse.json({ error: "任务不存在" }, { status: 404 });
      }

      const progress = await prisma.taskProgress.findUnique({
        where: {
          profileId_taskId: {
            profileId: profile.id,
            taskId: taskDef.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        task: {
          ...taskDef,
          progress: progress?.progress || 0,
          target: progress?.target || 1,
          status: progress?.status || "PENDING",
        },
      });
    }

    // 否则返回所有任务进度
    const taskProgress = await prisma.taskProgress.findMany({
      where: { profileId: profile.id },
      include: { task: true },
    });

    const tasks = {
      guide: taskProgress.filter((t) => t.task.category === "GUIDE"),
      daily: taskProgress.filter((t) => t.task.category === "DAILY"),
      achievement: taskProgress.filter((t) => t.task.category === "ACHIEVEMENT"),
    };

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("获取任务进度失败:", error);
    return NextResponse.json(
      { error: "获取任务进度失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新任务进度
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { taskCode, progress } = body;

    const profile = await prisma.userGameProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "游戏档案不存在" }, { status: 404 });
    }

    const taskDef = await prisma.taskDefinition.findUnique({
      where: { code: taskCode },
    });

    if (!taskDef) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 获取当前进度
    let taskProgress = await prisma.taskProgress.findUnique({
      where: {
        profileId_taskId: {
          profileId: profile.id,
          taskId: taskDef.id,
        },
      },
    });

    // 如果不存在，创建新进度
    if (!taskProgress) {
      taskProgress = await prisma.taskProgress.create({
        data: {
          profileId: profile.id,
          taskId: taskDef.id,
          status: "IN_PROGRESS",
          progress: 0,
          target: (taskDef.condition as { count?: number })?.count || 1,
        },
      });
    }

    // 如果已完成，不再更新
    if (taskProgress.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "任务已完成",
        task: taskProgress,
      });
    }

    // 计算新进度
    const newProgress = Math.min(taskProgress.progress + progress, taskProgress.target);
    const isCompleted = newProgress >= taskProgress.target;

    // 更新进度
    const updated = await prisma.taskProgress.update({
      where: { id: taskProgress.id },
      data: {
        progress: newProgress,
        status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // 如果完成，奖励经验
    if (isCompleted) {
      await addExp(
        session.user.id,
        "COMPLETE_TASK",
        `完成任务: ${taskDef.name}`,
        taskDef.id
      );
    }

    return NextResponse.json({
      success: true,
      isCompleted,
      task: updated,
      rewards: isCompleted
        ? { exp: taskDef.expReward, coins: taskDef.coinReward }
        : null,
    });
  } catch (error) {
    console.error("更新任务进度失败:", error);
    return NextResponse.json(
      { error: "更新任务进度失败" },
      { status: 500 }
    );
  }
}
