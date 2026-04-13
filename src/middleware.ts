import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const locales = ["zh", "en"] as const;
const defaultLocale = "zh";

const PROMO_COOKIE = "__promo_ref";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length >= 2 && locales.includes(parts[1] as (typeof locales)[number])) {
    return "/" + parts.slice(2).join("/");
  }
  return pathname;
}

function decodeBase64Url(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return str;
}

function getJwtPayload(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(decodeBase64Url(payload));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("__Host-next-auth.session-token")?.value
  );
}

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const pathname = request.nextUrl.pathname;

  // 1. 设置推广 cookie（优先级最高）
  if (ref) {
    const response = intlMiddleware(request);
    response.cookies.set(PROMO_COOKIE, ref, {
      maxAge: MAX_AGE,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    return response;
  }

  // 2. 获取无 locale 前缀的路径用于 auth 判断
  const cleanPath = stripLocalePrefix(pathname);

  const isAdminPath = cleanPath.startsWith("/admin");
  const isDashboardPath = cleanPath.startsWith("/dashboard");
  const isCompanyPath = cleanPath.startsWith("/company");
  const isUserRechargePath = cleanPath.startsWith("/user/recharge");
  const isPromoterPath =
    cleanPath.startsWith("/promoter/dashboard") || cleanPath.startsWith("/promoter/links");

  const sessionToken = getSessionToken(request);
  const payload = sessionToken ? getJwtPayload(sessionToken) : null;
  const role = payload?.role as string | undefined;

  if (!sessionToken) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL("/auth/login/admin", request.url));
    }
    if (isCompanyPath) {
      return NextResponse.redirect(new URL("/auth/login/company", request.url));
    }
    if (isDashboardPath || isUserRechargePath || isPromoterPath) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return intlMiddleware(request);
  }

  // Token 存在时做角色校验（JWT payload 未验证签名，页面级会做完整校验）
  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isCompanyPath && role !== "COMPANY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isDashboardPath && role !== "USER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|txt|xml)$).*)"],
};
