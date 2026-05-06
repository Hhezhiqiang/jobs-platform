import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;

// 第二次数据清理：将 4/10 的职位日期推到最近 7 天
export async function POST(req: NextRequest) {
  // Admin auth check
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== CLEANUP_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    const now = new Date();
    const results: Record<string, number> = {};

    // 找出所有 datePosted 在 2026-04-10 的职位
    const targetDate = new Date("2026-04-10T00:00:00.000Z");
    const endDate = new Date("2026-04-11T00:00:00.000Z");
    const oldJobs = await prisma.jobs.findMany({
      where: {
        datePosted: { gte: targetDate, lt: endDate },
      },
      select: { id: true },
    });
    results.foundJobs = oldJobs.length;

    // 将每个职位的 datePosted 分散到最近 7 天
    const updates = oldJobs.map((job, i) => {
      const daysAgo = i % 7;
      const newDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return prisma.jobs.update({
        where: { id: job.id },
        data: { datePosted: newDate },
      });
    });

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }
    results.updatedJobs = updates.length;

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    logger.error("Cleanup v2 error:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
