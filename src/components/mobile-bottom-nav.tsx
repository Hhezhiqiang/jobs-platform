"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "jobs",
    zh: "职位",
    en: "Jobs",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    href: "circles",
    zh: "圈子",
    en: "Circles",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="9" cy="9" r="4" />
        <circle cx="17" cy="13" r="3" />
        <circle cx="7" cy="17" r="3" />
      </svg>
    ),
  },
  {
    href: "career-trail",
    zh: "成长",
    en: "Trail",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 17l4-4 4 4 4-6 6 6" />
        <path d="M14 7h7v7" />
      </svg>
    ),
  },
  {
    href: "blog",
    zh: "博客",
    en: "Blog",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
        <path d="M4 19.5V21h16" />
      </svg>
    ),
  },
  {
    href: "dashboard",
    zh: "我的",
    en: "Me",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  if (pathname.includes("/admin")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 backdrop-blur-xl"
      style={{
        background: "rgba(10,10,10,0.85)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {ITEMS.map((it) => {
        const active = pathname.startsWith(`/${locale}/${it.href}`);
        return (
          <Link
            key={it.href}
            href={`/${locale}/${it.href}`}
            className="flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-mono uppercase tracking-widest"
            style={{
              color: active ? "#B6FF3D" : "rgba(245,245,245,0.45)",
            }}
          >
            {it.icon}
            <span>{locale === "zh" ? it.zh : it.en}</span>
          </Link>
        );
      })}
    </nav>
  );
}
