import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchAdzunaJobs, fetchAdzunaBulkJobs, type ProgressCallback } from "@/lib/adzuna-api";
import { logger } from "@/lib/logger";

function isAuthorized(session: any, authHeader: string | null): boolean {
  if (session?.user?.role === "ADMIN") return true;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === "Bearer " + cronSecret) return true;
  return false;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const authHeader = req.headers.get("authorization");

  if (!isAuthorized(session, authHeader)) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { pages = 5 } = body;

    const result = await fetchAdzunaBulkJobs({ pages });

    return NextResponse.json({ success: true, count: result });
  } catch (error: any) {
    logger.error("Adzuna bulk sync error:", error);
    return NextResponse.json({ error: error.message || "同步失败" }, { status: 500 });
  }
}
