export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { addExp, updateTaskProgress } from "@/lib/game/exp-system";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ExpType } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { type, jobId, articleId } = body;

    const userId = session.user.id;
    let result;

    switch (type) {
      case "VIEW_JOB":
        result = await addExp(userId, "VIEW_JOB", "浏览职位", jobId);
        // 更新每日浏览任务
        await updateTaskProgress(userId, "DAILY_VIEW_JOBS", 1);
        break;

      case "APPLY_JOB":
        result = await addExp(userId, "APPLY_JOB", "投递简历", jobId);
        // 更新申请任务
        await updateTaskProgress(userId, "GUIDE_FIRST_APPLY", 1);
        break;

      case "READ_ARTICLE":
        result = await addExp(userId, "READ_ARTICLE", "阅读文章", articleId);
        // 更新每日阅读任务
        await updateTaskProgress(userId, "DAILY_READ_ARTICLE", 1);
        break;

      case "COMPLETE_PROFILE":
        result = await addExp(userId, "COMPLETE_PROFILE", "完善个人资料");
        // 更新完善资料任务
        await updateTaskProgress(userId, "GUIDE_COMPLETE_PROFILE", 1);
        break;

      default:
        return NextResponse.json({ error: "未知的追踪类型" }, { status: 400 });
    }

    return NextResponse.json({
      ...result,
    });
  } catch (error) {
    logger.error("追踪行为失败:", error);
    return NextResponse.json(
      { error: "追踪行为失败" },
      { status: 500 }
    );
  }
}
