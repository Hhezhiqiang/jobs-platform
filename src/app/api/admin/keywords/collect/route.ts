export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectKeywords } from "@/lib/keyword-monitor";
import { runAutoPipeline } from "@/lib/auto-publisher";
import { runAutoBlogPipeline } from "@/lib/auto-blog-generator";

const CRON_LOCK_KEY = "cron_lock_keyword_collect";
const LOCK_TTL_MINUTES = 10;

async function acquireCronLock(): Promise<boolean> {
  const now = new Date();
  const ttlAgo = new Date(now.getTime() - LOCK_TTL_MINUTES * 60 * 1000);

  try {
    const updated = await prisma.seo_settings.updateMany({
      where: { key: CRON_LOCK_KEY, updatedAt: { lt: ttlAgo } },
      data: { value: now.toISOString(), updatedAt: now },
    });

    if (updated.count > 0) return true;

    await prisma.seo_settings.create({
      data: { key: CRON_LOCK_KEY, value: now.toISOString(), description: "cron lock" },
    });
    return true;
  } catch (err: any) {
    if (err.code === "P2002") return false;
    throw err;
  }
}

async function releaseCronLock(): Promise<void> {
  try {
    const stale = new Date(Date.now() - (LOCK_TTL_MINUTES + 1) * 60 * 1000);
    await prisma.seo_settings.updateMany({
      where: { key: CRON_LOCK_KEY },
      data: { updatedAt: stale },
    });
  } catch (err) {
    console.error("Failed to release cron lock:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 权限验证
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

    // 获取锁
    const locked = await acquireCronLock();
    if (!locked) {
      return NextResponse.json(
        { success: true, skipped: true, reason: "Another cron instance is running" },
        { status: 200 }
      );
    }

    try {
      console.log("[keyword-collect] Starting collection...");
      const result = await collectKeywords();
      console.log(`[keyword-collect] Result: ${JSON.stringify(result)}`);

      // 运行自动发布流水线
      let autoResult: any = { processed: 0, published: 0, errors: 0, details: [] };
      if (result.newIds && result.newIds.length > 0) {
        try {
          autoResult = await runAutoPipeline(result.newIds);
        } catch (err: any) {
          console.error("Auto pipeline error:", err.message);
        }
      }

      // 运行 KIMI 博客生成器
      let blogResult: any = { processed: 0, published: 0, errors: 0, details: [] };
      if (result.newIds && result.newIds.length > 0 && process.env.KIMI_API_KEY) {
        try {
          blogResult = await runAutoBlogPipeline(result.newIds);
        } catch (err: any) {
          console.error("Auto blog pipeline error:", err.message);
        }
      }

      return NextResponse.json({
        success: true,
        result,
        autoResult,
        blogResult,
      });
    } finally {
      await releaseCronLock();
    }
  } catch (error: any) {
    console.error("[keyword-collect] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
