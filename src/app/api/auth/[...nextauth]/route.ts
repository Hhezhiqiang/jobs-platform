import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function handler(req: NextRequest, context: any) {
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
  return nextAuthHandler(req, context);
}

export { handler as GET, handler as POST };
