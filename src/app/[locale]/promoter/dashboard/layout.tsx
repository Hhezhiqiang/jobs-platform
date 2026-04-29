"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export default function PromoterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();

  const navItems = [
    { href: `/${locale}/promoter/dashboard`, label: "数据看板" },
    { href: `/${locale}/promoter/dashboard/links`, label: "推广链接" },
    { href: `/${locale}/promoter/dashboard/earnings`, label: "收益提现" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href={`/${locale}/promoter/dashboard`} className="text-xl font-bold text-gray-900">
                推广者中心
              </Link>
              <nav className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link href={`/${locale}/promoter/login`} className="text-sm text-gray-500 hover:text-gray-700">
              退出
            </Link>
          </div>
        </div>
      </header>

      <div className="pb-20">{children}</div>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-xs font-medium rounded-md ${
              pathname === item.href ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
