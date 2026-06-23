"use client";

import "@/styles/volt-theme.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "jobs", zh: "职位", en: "Jobs" },
  { href: "circles", zh: "圈子", en: "Circles" },
  { href: "career-trail", zh: "成长", en: "Trail" },
  { href: "blog", zh: "博客", en: "Notes" },
];

const MORE = [
  { href: "companies", zh: "公司", en: "Companies" },
  { href: "salary-insights", zh: "薪资", en: "Salary" },
  { href: "topics", zh: "话题", en: "Topics" },
  { href: "aggregated-jobs", zh: "聚合职位", en: "Aggregated" },
  { href: "faq", zh: "常见问题", en: "FAQ" },
];

export function Header({ transparent }: { transparent?: boolean }) {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: session, status } = useSession();

  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const altLocale = locale === "zh" ? "en" : "zh";
  const altPath = pathname.replace(/^\/(zh|en)/, `/${altLocale}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = () => { setMenuOpen(false); setMoreOpen(false); };
    if (menuOpen || moreOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen, moreOpen]);

  if (pathname.includes("/admin")) return null;

  return (
    <header
      className="volt-site-header sticky top-0 z-40 hidden md:block backdrop-blur-xl"
      style={{
        background:
          scrolled || !transparent ? "rgba(10,10,10,0.78)" : "transparent",
        borderBottom:
          scrolled || !transparent
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md grid place-items-center"
            style={{ background: "#B6FF3D", color: "#0a0a0a" }}
          >
            <span className="font-bold text-sm">J</span>
          </div>
          <span className="font-semibold tracking-tight text-white">
            JobQuip
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((n) => {
            const active = pathname.startsWith(`/${locale}/${n.href}`);
            return (
              <Link
                key={n.href}
                href={`/${locale}/${n.href}`}
                className="transition-colors"
                style={{
                  color: active ? "#B6FF3D" : "rgba(245,245,245,0.62)",
                }}
              >
                {locale === "zh" ? n.zh : n.en}
              </Link>
            );
          })}

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex items-center gap-1 transition-colors"
              style={{
                color: MORE.some((m) => pathname.startsWith(`/${locale}/${m.href}`))
                  ? "#B6FF3D"
                  : "rgba(245,245,245,0.62)",
              }}
            >
              {locale === "zh" ? "更多" : "More"}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{
                  transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {moreOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-3 w-56 overflow-hidden rounded-xl border shadow-2xl"
                style={{
                  background: "#111111",
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                {MORE.map((m) => {
                  const active = pathname.startsWith(`/${locale}/${m.href}`);
                  return (
                    <Link
                      key={m.href}
                      href={`/${locale}/${m.href}`}
                      className="block px-4 py-2.5 text-sm transition-colors hover:text-white"
                      style={{
                        color: active ? "#B6FF3D" : "rgba(245,245,245,0.7)",
                      }}
                    >
                      {locale === "zh" ? m.zh : m.en}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={altPath}
            className="hidden md:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              color: "rgba(245,245,245,0.62)",
            }}
            title="Switch language"
          >
            {altLocale === "zh" ? "中" : "EN"}
          </Link>

          {status === "loading" ? (
            <div
              className="h-9 w-20 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          ) : session?.user ? (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "rgba(245,245,245,0.85)",
                }}
              >
                <span
                  className="h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold"
                  style={{ background: "#B6FF3D", color: "#0a0a0a" }}
                >
                  {(session.user.name || session.user.email || "?")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">
                  {session.user.name || session.user.email}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border shadow-2xl"
                  style={{
                    background: "#111111",
                    borderColor: "rgba(255,255,255,0.14)",
                  }}
                >
                  {[
                    { href: `/${locale}/dashboard`, label: locale === "zh" ? "工作台" : "Dashboard" },
                    { href: `/${locale}/user/favorites`, label: locale === "zh" ? "收藏" : "Favorites" },
                    { href: `/${locale}/user/applications`, label: locale === "zh" ? "申请记录" : "Applications" },
                    { href: `/${locale}/user/settings`, label: locale === "zh" ? "设置" : "Settings" },
                  ].map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="block px-4 py-2.5 text-sm transition-colors hover:text-white"
                      style={{ color: "rgba(245,245,245,0.7)" }}
                    >
                      {it.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => signOut({ callbackUrl: `/${locale}` })}
                    className="block w-full px-4 py-2.5 text-left text-sm transition-colors border-t"
                    style={{
                      color: "#ff5a36",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    {locale === "zh" ? "退出登录" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/signin`}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "#B6FF3D", color: "#0a0a0a" }}
            >
              {locale === "zh" ? "登录" : "Sign in"}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
