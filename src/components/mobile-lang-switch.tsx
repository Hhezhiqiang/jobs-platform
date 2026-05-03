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
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-[430px] mx-auto px-4 py-2">
        <div className="flex items-center justify-end">
          {/* 语言切换按钮 */}
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
