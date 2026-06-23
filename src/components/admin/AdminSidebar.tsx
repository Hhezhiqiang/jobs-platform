"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Briefcase, Building2, FileText, Megaphone,
  Users, TrendingUp, Wallet, KeyRound, BarChart3, Globe, FileSpreadsheet,
  ChevronLeft, ChevronRight, Menu, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  { items: [{ label: "数据概览", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> }] },
  {
    label: "内容管理",
    items: [
      { label: "职位管理", href: "/admin/jobs", icon: <Briefcase className="h-5 w-5" /> },
      { label: "公司管理", href: "/admin/companies", icon: <Building2 className="h-5 w-5" /> },
      { label: "博客管理", href: "/admin/blog", icon: <FileText className="h-5 w-5" /> },
      { label: "广告管理", href: "/admin/ads", icon: <Megaphone className="h-5 w-5" /> },
    ],
  },
  {
    label: "用户与推广",
    items: [
      { label: "用户管理", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
      { label: "推广者管理", href: "/admin/promoters", icon: <TrendingUp className="h-5 w-5" /> },
      { label: "提现审核", href: "/admin/withdrawals", icon: <Wallet className="h-5 w-5" /> },
    ],
  },
  {
    label: "数据与 SEO",
    items: [
      { label: "关键词监控", href: "/admin/keywords", icon: <KeyRound className="h-5 w-5" /> },
      { label: "数据分析", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
      { label: "地理位置", href: "/admin/analytics/geo", icon: <Globe className="h-5 w-5" /> },
      { label: "CPS 报表", href: "/admin/reports/cps", icon: <FileSpreadsheet className="h-5 w-5" /> },
    ],
  },
];

function withLocale(href: string, locale: string): string {
  return `/${locale}${href}`;
}

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * 管理后台侧边栏组件 — 分组导航、折叠、移动端滑出
 */
export function AdminSidebar({ mobileOpen = false, onMobileClose, collapsed = false, onCollapseChange }: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === `/${locale}/admin`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <Link href={withLocale("/admin", locale)} className={cn("flex items-center gap-3 text-lg font-bold", collapsed && "hidden md:flex")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold">JQ</span>
          </div>
          {!collapsed && <span className="whitespace-nowrap">管理后台</span>}
        </Link>
        <button onClick={() => onCollapseChange?.(!collapsed)} className="hidden rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:inline-flex" aria-label={collapsed ? "展开" : "折叠"}>
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <button onClick={onMobileClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:hidden" aria-label="关闭">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.label && !collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{group.label}</p>}
            {group.label && collapsed && <div className="mx-2 mb-2 border-t border-gray-800" />}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={withLocale(item.href, locale)}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive(item.href) ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white")}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onMobileClose?.()}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-gray-800 p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-700">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-300">
                {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session?.user?.name || "管理员"}</p>
                <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: `/${locale}` })} className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white" aria-label="退出登录">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 md:block", collapsed ? "w-20" : "w-64")}>{sidebarContent}</aside>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 md:hidden">{sidebarContent}</aside>
        </>
      )}
    </>
  );
}
export { AdminSidebar as default };
