"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, Building2, BookOpen, TrendingUp, User } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const t = useTranslations();

  const navItems = [
    { label: t("nav.jobs"), href: `/${locale}/jobs`, icon: Briefcase },
    { label: t("nav.companies"), href: `/${locale}/companies`, icon: Building2 },
    { label: t("nav.blog"), href: `/${locale}/blog`, icon: BookOpen },
    { label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: TrendingUp },
    { label: t("nav.dashboard"), href: `/${locale}/dashboard`, icon: User },
  ];

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname?.substring(locale.length + 1) || "";
    const hrefWithoutLocale = href.substring(locale.length + 1);
    return pathWithoutLocale === hrefWithoutLocale || pathWithoutLocale.startsWith(hrefWithoutLocale + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-between items-center px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] z-50">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0 transition-all ${
              active ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-blue-50" : ""}`}>
              <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <span className={`text-[10px] leading-tight ${active ? "font-medium text-blue-600" : "text-gray-400"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
