import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    // 广告追踪：每分钟 60 次（防刷）
    const rateLimitResult = checkRateLimit(ip, 60, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { adId, type } = body; // type: "view" or "click"

    if (!adId || !type) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (type === "click") {
      await prisma.ads.update({
        where: { id: adId },
        data: { clickCount: { increment: 1 } },
      });
    } else {
      await prisma.ads.update({
        where: { id: adId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}
