export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { doCheckin, getCheckinStatus, getCheckinHistory } from "@/lib/game/checkin-system";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "history") {
      const days = parseInt(searchParams.get("days") || "30");
      const history = await getCheckinHistory(session.user.id, days);
      return NextResponse.json({ success: true, history });
    }

    const status = await getCheckinStatus(session.user.id);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("获取签到状态失败:", error);
    return NextResponse.json(
      { error: "获取签到状态失败" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const result = await doCheckin(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("签到失败:", error);
    return NextResponse.json(
      { error: "签到失败" },
      { status: 500 }
    );
  }
}
