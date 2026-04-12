import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROMO_COOKIE = "__promo_ref";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const pathname = request.nextUrl.pathname;

  // 1. 设置推广 cookie（优先级最高，任何页面都能设置）
  if (ref) {
    const response = NextResponse.next();
    response.cookies.set(PROMO_COOKIE, ref, {
      maxAge: MAX_AGE,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    return response;
  }

  // 2. 读取 JWT token（不依赖数据库，轻量）
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // 3. 受保护路由
  const isAdminPath = pathname.startsWith("/admin");
  const isDashboardPath = pathname.startsWith("/dashboard");
  const isCompanyPath = pathname.startsWith("/company");
  const isUserRechargePath = pathname.startsWith("/user/recharge");
  const isPromoterPath = pathname.startsWith("/promoter/dashboard") || pathname.startsWith("/promoter/links");

  // 未登录 -> 跳转登录
  if (!token) {
    if (isAdminPath) return NextResponse.redirect(new URL("/auth/login/admin", request.url));
    if (isCompanyPath) return NextResponse.redirect(new URL("/auth/login/company", request.url));
    if (isDashboardPath || isUserRechargePath || isPromoterPath) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  // 已登录 -> 角色校验
  const role = token.role as string | undefined;

  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isCompanyPath && role !== "COMPANY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Dashboard 只允许普通 USER / ADMIN（公司用户不走 /dashboard）
  if (isDashboardPath && role !== "USER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|unauthorized).*)"],
};
