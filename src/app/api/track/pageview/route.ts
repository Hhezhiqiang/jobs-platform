import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

function generateSessionId(ip: string, userAgent: string): string {
  return createHash("md5")
    .update(ip + userAgent + new Date().toISOString().split("T")[0])
    .digest("hex")
    .substring(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer } = body;

    // 1. 获取 Vercel 原生地理位置数据 (100% 准确，无限制，不依赖第三方 API)
    // x-vercel-ip-country 返回国家代码 (如 CN, US, HK)
    // x-vercel-ip-city 返回城市名称
    const country = request.headers.get("x-vercel-ip-country") || "Unknown";
    const city = request.headers.get("x-vercel-ip-city") || "Unknown";

    // 2. 获取 IP 和 UA
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // 3. 获取用户 ID
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 4. 生成 Session ID
    const sessionId = generateSessionId(ip, userAgent);

    // 5. 写入数据库
    await prisma.page_views.create({
      data: {
        path: path || "/",
        userAgent: userAgent.substring(0, 500),
        ip: ip.substring(0, 45),
        referrer: referrer?.substring(0, 500) || null,
        userId,
        country,
        city,
        sessionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Tracking error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
