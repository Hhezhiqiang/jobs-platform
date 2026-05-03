"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const routeTitles: Record<string, string> = {
  "/admin": "数据概览",
  "/admin/jobs": "职位管理",
  "/admin/companies": "公司管理",
  "/admin/blog": "博客管理",
  "/admin/ads": "广告管理",
  "/admin/users": "用户管理",
  "/admin/promoters": "推广者管理",
  "/admin/withdrawals": "提现审核",
  "/admin/keywords": "关键词监控",
  "/admin/analytics": "数据分析",
  "/admin/analytics/geo": "地理位置",
  "/admin/reports/cps": "CPS 报表",
};

export interface AdminHeaderProps {
  onMenuToggle: () => void;
  collapsed?: boolean;
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const cleanPath = pathname.replace(/^\/(zh|en)/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "管理后台", href: "/admin" }];
  let builtPath = "/admin";
  for (const segment of segments) {
    if (segment === "admin") continue;
    builtPath += `/${segment}`;
    const title = routeTitles[builtPath] || segment;
    crumbs.push({ label: title, href: builtPath });
  }
  return crumbs;
}

/**
 * 管理后台顶部导航栏 — 面包屑 + 通知 + 返回前台
 */
export function AdminHeader({ onMenuToggle, collapsed }: AdminHeaderProps) {
  const pathname = usePathname() ?? "";
  const breadcrumbs = getBreadcrumbs(pathname);
  const cleanPath = pathname.replace(/^\/(zh|en)/, "");
  const currentTitle = routeTitles[cleanPath] || breadcrumbs[breadcrumbs.length - 1]?.label || "管理后台";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md md:px-6 transition-[padding] duration-300",
        collapsed ? "md:pl-28" : "md:pl-72"
      )}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden" aria-label="打开菜单">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{currentTitle}</h1>
          <nav aria-label="面包屑导航" className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-gray-600">{crumb.label}</Link>
                ) : (
                  <span className="text-gray-600">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/zh/dashboard/notifications`}
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="通知"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Link>
        <Link href="/zh" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">返回前台</span>
        </Link>
      </div>
    </header>
  );
}
export { AdminHeader as default };
