"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export function MobileLangSwitch() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  // 语言切换路径
  const switchLocalePath = `/${isEn ? "zh" : "en"}${pathname?.substring(locale.length + 1) || ""}`;

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-[430px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧 Logo/站点 */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
              J
            </div>
            <span className="text-base font-bold text-gray-900">JobQuip</span>
          </Link>

          {/* 右侧语言切换按钮 */}
          <Link
            href={switchLocalePath}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Globe className="w-4 h-4" />
            {isEn ? "中文" : "EN"}
          </Link>
        </div>
      </div>
    </header>
  );
}
