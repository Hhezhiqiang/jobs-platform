export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectKeywords } from "@/lib/keyword-monitor";
import { runAutoPipeline } from "@/lib/auto-publisher";
import { runAutoBlogPipeline } from "@/lib/auto-blog-generator";
import { logger } from "@/lib/logger";

const CRON_LOCK_KEY = "cron_lock_keyword_collect";
const LOCK_TTL_MINUTES = 10;

type PipelineResult = {
  processed: number;
  published?: number;
  drafted?: number;
  errors: number;
  details: unknown[];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

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
      data: {
        id: crypto.randomUUID(),
        key: CRON_LOCK_KEY,
        value: now.toISOString(),
        description: "cron lock",
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error: unknown) {
    if (isPrismaUniqueError(error)) return false;
    throw error;
  }
}

function isPrismaUniqueError(error: unknown): error is Error & { code: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}

async function releaseCronLock(): Promise<void> {
  try {
    const stale = new Date(Date.now() - (LOCK_TTL_MINUTES + 1) * 60 * 1000);
    await prisma.seo_settings.updateMany({
      where: { key: CRON_LOCK_KEY },
      data: { updatedAt: stale },
    });
  } catch (error: unknown) {
    logger.error("Failed to release cron lock:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = request.headers.get("user-agent") || "";
    const isVercelCron = userAgent.includes("Vercelbot");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
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

      let autoResult: PipelineResult = { processed: 0, published: 0, errors: 0, details: [] };
      if (result.newIds && result.newIds.length > 0) {
        try {
          autoResult = await runAutoPipeline(result.newIds);
        } catch (error: unknown) {
          logger.error("Auto pipeline error:", getErrorMessage(error));
        }
      }

      let blogResult: PipelineResult = { processed: 0, drafted: 0, errors: 0, details: [] };
      if (result.newIds && result.newIds.length > 0 && process.env.KIMI_API_KEY) {
        try {
          blogResult = await runAutoBlogPipeline(result.newIds);
        } catch (error: unknown) {
          logger.error("Auto blog pipeline error:", getErrorMessage(error));
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
  } catch (error: unknown) {
    logger.error("[keyword-collect] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
