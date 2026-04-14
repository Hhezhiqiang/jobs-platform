export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectKeywords } from "@/lib/keyword-monitor";
import { runAutoPipeline } from "@/lib/auto-publisher";

const CRON_LOCK_KEY = "cron_lock_keyword_collect";
const LOCK_TTL_MINUTES = 10;

async function acquireCronLock(): Promise<boolean> {
  const now = new Date();
  const ttlAgo = new Date(now.getTime() - LOCK_TTL_MINUTES * 60 * 1000);

  const updated = await prisma.seo_settings.updateMany({
    where: { key: CRON_LOCK_KEY, updatedAt: { lt: ttlAgo } },
    data: { value: now.toISOString(), updatedAt: now },
  });

  if (updated.count > 0) {
    return true;
  }

  try {
    await prisma.seo_settings.create({
      data: { key: CRON_LOCK_KEY, value: now.toISOString(), description: "cron lock" },
    });
    return true;
  } catch (err: any) {
    if (err.code === "P2002") {
      return false;
    }
    throw err;
  }
}

async function releaseCronLock(): Promise<void> {
  const stale = new Date(Date.now() - (LOCK_TTL_MINUTES + 1) * 60 * 1000);
  await prisma.seo_settings.updateMany({
    where: { key: CRON_LOCK_KEY },
    data: { updatedAt: stale },
  });
}

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get("Authorization")?.replace("Bearer ", "");
    const { searchParams } = new URL(request.url);
    const secretQuery = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = request.headers.get("user-agent") || "";
    const isVercelCron = userAgent.includes("Vercelbot");

    const isCronAuthorized =
      isVercelCron ||
      (!!cronSecret && (secretHeader === cronSecret || secretQuery === cronSecret));

    if (!isCronAuthorized) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const locked = await acquireCronLock();
    if (!locked) {
      return NextResponse.json(
        { success: true, skipped: true, reason: "Another cron instance is running" },
        { status: 200 }
      );
    }

    try {
      const result = await collectKeywords();
      const autoResult = await runAutoPipeline(result.newIds);

      let cleanupResult = { monitorsDeleted: 0, pagesDeleted: 0 };
      try {
        const { cleanupOldData } = await import("@/lib/data-cleanup");
        cleanupResult = await cleanupOldData();
        if (cleanupResult.monitorsDeleted > 0 || cleanupResult.pagesDeleted > 0) {
          if (process.env.NODE_ENV === "development") {
             
            console.log(
              `[data-cleanup] removed ${cleanupResult.monitorsDeleted} junk monitors and ${cleanupResult.pagesDeleted} draft pages`
            );
          }
        }
      } catch (cleanupErr) {
        console.error("[data-cleanup] failed:", cleanupErr);
      }

      return NextResponse.json({ success: true, result, autoResult, cleanup: cleanupResult });
    } finally {
      await releaseCronLock();
    }
  } catch (error) {
    console.error("[api/admin/keywords/collect] error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
