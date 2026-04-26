import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, path, duration, clicked, ...eventData } = body;

    // 获取用户 session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 生成 sessionId（基于 cookie）
    let sessionId = req.cookies.get("analytics_sid")?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // 获取 IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    await prisma.page_views.create({
      data: {
        path: path || req.nextUrl.pathname,
        userAgent: req.headers.get("user-agent") || null,
        ip: ip !== "unknown" ? ip : null,
        referrer: req.headers.get("referer") || null,
        country: null, // 异步填充
        city: null,
        userId,
        sessionId,
        duration: duration || null,
        eventType: type || "page_view",
        eventData: clicked ? { clicked: clicked.slice(0, 10), ...eventData } : eventData,
      },
    });

    return NextResponse.json({ success: true }, {
      headers: {
        "Set-Cookie": `analytics_sid=${sessionId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`,
      },
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
