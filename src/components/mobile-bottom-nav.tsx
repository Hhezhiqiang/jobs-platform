"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, BookOpen, TrendingUp, User, Search } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const t = useTranslations();
  const isEn = locale === "en";

  const navItems = [
    { label: t("nav.jobs"), href: `/${locale}/jobs`, icon: Briefcase },
    { label: isEn ? "Job Demands" : "求职需求", href: `/${locale}/job-demands`, icon: Search },
    { label: t("nav.blog"), href: `/${locale}/blog`, icon: BookOpen },
    { label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: TrendingUp },
    { label: t("nav.dashboard"), href: `/${locale}/dashboard`, icon: User },
  ];

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname?.substring(locale.length + 1) || "";
    const hrefWithoutLocale = href.substring(locale.length + 1);
    return pathWithoutLocale === hrefWithoutLocale || pathWithoutLocale.startsWith(hrefWithoutLocale + "/");
  };

  // Hide on admin pages — admin has its own navigation
  const pathWithoutLocale = pathname?.substring(locale.length + 1) || "";
  if (pathWithoutLocale.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 md:hidden">
      <div className="max-w-[430px] mx-auto px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 transition-all rounded-lg ${
                  active ? "text-blue-600 bg-blue-50/50" : "text-gray-400"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-blue-100" : ""}`}>
                  <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <span className={`text-[10px] mt-0.5 truncate w-full text-center ${active ? "font-medium text-blue-600" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
