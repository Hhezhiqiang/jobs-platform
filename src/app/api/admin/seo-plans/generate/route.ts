export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateSEOPlan } from "@/lib/seo-plan";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { monitorId } = await request.json();
    if (!monitorId) {
      return NextResponse.json({ error: "monitorId required" }, { status: 400 });
    }

    const plan = await generateSEOPlan(monitorId);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("[api/admin/seo-plans/generate] error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
