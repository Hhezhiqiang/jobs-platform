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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 safe-area-bottom">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              active ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-500"}`} />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
