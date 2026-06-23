"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV = [
  { href: "jobs", label: "Jobs" },
  { href: "companies", label: "Companies" },
  { href: "salary-insights", label: "Salary" },
  { href: "career-trail", label: "Trail" },
  { href: "blog", label: "Notes" },
];

export function HeaderVolt({ locale = "zh" }: { locale?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl transition-all"
      style={{
        background: scrolled ? "rgba(10,10,10,0.78)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}/volt`} className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md grid place-items-center"
            style={{ background: "var(--volt)", color: "#0a0a0a" }}
          >
            <span className="font-bold text-sm">J</span>
          </div>
          <span className="font-semibold tracking-tight">JobQuip</span>
          <span className="volt-chip ml-1">v2</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={`/${locale}/${n.href}`}
              className="volt-link text-[color:var(--fg-dim)] hover:text-[color:var(--fg)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="hidden md:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--line-2)", color: "var(--fg-dim)" }}
          >
            <span>Search</span>
            <kbd
              className="rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              ⌘K
            </kbd>
          </button>
          <Link href={`/${locale}/auth/login`} className="volt-btn text-sm">
            Sign in
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
