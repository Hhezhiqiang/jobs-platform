import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIP, checkRateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// 生成会话ID（基于IP + User-Agent的简单哈希）
function generateSessionId(ip: string, userAgent: string): string {
  const crypto = require("crypto");
  return crypto
    .createHash("md5")
    .update(ip + userAgent + new Date().toISOString().split("T")[0])
    .digest("hex")
    .substring(0, 16);
}

// 记录页面访问
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer } = body;

    // 获取请求信息
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // 速率限制：同一 IP 30 次/分钟
    const rateLimit = checkRateLimit(ip, 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 获取登录用户
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 生成会话ID
    const sessionId = generateSessionId(ip, userAgent);

    // 保存访问记录
    await prisma.page_views.create({
      data: {
        path: path || "/",
        userAgent: userAgent.substring(0, 500), // 限制长度
        ip: ip.substring(0, 45), // IPv6最大长度
        referrer: referrer?.substring(0, 500) || null,
        userId,
        sessionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Page view tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track page view" },
      { status: 500 }
    );
  }
}
