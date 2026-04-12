export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { settleCommissions } from "@/lib/promoter";

export async function GET(request: Request) {
  // 校验 Cron Secret，防止外部直接调用
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settledCount = await settleCommissions();
    return NextResponse.json({
      success: true,
      settledCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Commission settlement cron error:", error);
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
  }
}
