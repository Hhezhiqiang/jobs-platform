export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { collectKeywords } from "@/lib/keyword-monitor";
import { runAutoPipeline } from "@/lib/auto-publisher";

export async function POST(request: NextRequest) {
  try {
    // Allow cron jobs via secret header/query OR Vercel Cron user-agent
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

    const result = await collectKeywords();

    // Run fully automatic pipeline for newly inserted keywords
    const autoResult = await runAutoPipeline(result.newIds);

    return NextResponse.json({ success: true, result, autoResult });
  } catch (error) {
    console.error("[api/admin/keywords/collect] error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
