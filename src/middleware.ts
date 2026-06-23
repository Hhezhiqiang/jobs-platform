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

function getCurrentLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length >= 2 && locales.includes(parts[1] as (typeof locales)[number])) {
    return parts[1];
  }
  return defaultLocale;
}

function decodeBase64Url(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return str;
}

interface JwtPayload {
  role?: string;
  sub?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

function getJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(decodeBase64Url(payload));
    return JSON.parse(json) as JwtPayload;
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
  const locale = getCurrentLocale(pathname);

  const isAdminPath = cleanPath.startsWith("/admin");
  const isDashboardPath = cleanPath.startsWith("/dashboard");
  const isCompanyPath = cleanPath.startsWith("/company");
  const isUserRechargePath = cleanPath.startsWith("/user/recharge");
  const isPromoterPath =
    cleanPath.startsWith("/promoter/dashboard") || cleanPath.startsWith("/promoter/links");

  // 公开路径（不需要登录）
  const publicPaths = ["/company/register"];
  const isPublicPath = publicPaths.includes(cleanPath);

  const sessionToken = getSessionToken(request);
  const payload = sessionToken ? getJwtPayload(sessionToken) : null;
  const role = payload?.role as string | undefined;

  // 未登录 → redirect 到带 locale 的登录页（公开路径除外）
  if (!sessionToken && !isPublicPath) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login/admin`, request.url));
    }
    if (isCompanyPath) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login/company`, request.url));
    }
    if (isDashboardPath || isUserRechargePath || isPromoterPath) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
    }
    return intlMiddleware(request);
  }

  // 已登录但角色不对 → redirect 到带 locale 的 unauthorized
  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
  }

  if (isCompanyPath && !isPublicPath && role !== "COMPANY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
  }

  if (isDashboardPath && role !== "USER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.well-known|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml|webmanifest)$).*)"],
};
