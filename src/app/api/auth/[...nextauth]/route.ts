export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function handler(req: NextRequest, context: Record<string, unknown>) {
  try {
    const ip = getClientIP(req);
    // NextAuth 登录：对 callback/credentials 相关请求限流
    const pathname = req.nextUrl.pathname;
    if (pathname.includes("callback") || pathname.includes("credentials")) {
      const rateLimit = checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: "登录请求过于频繁，请稍后再试" },
          { status: 429 }
        );
      }
    }
    return await nextAuthHandler(req, context);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
       
      console.error("Auth handler error:", error);
    }
    return NextResponse.json(
      { error: "认证服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST };
