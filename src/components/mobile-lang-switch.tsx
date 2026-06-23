"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileLangSwitch() {
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const altLocale = locale === "zh" ? "en" : "zh";
  const altPath = pathname.replace(/^\/(zh|en)/, `/${altLocale}`);

  if (pathname.includes("/admin")) return null;

  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-xl"
      style={{
        background: "rgba(10,10,10,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Link href={`/${locale}`} className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded-md grid place-items-center"
          style={{ background: "#B6FF3D", color: "#0a0a0a" }}
        >
          <span className="font-bold text-xs">J</span>
        </div>
        <span className="font-semibold tracking-tight text-white text-sm">
          JobQuip
        </span>
      </Link>
      <Link
        href={altPath}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-widest"
        style={{
          borderColor: "rgba(255,255,255,0.14)",
          color: "rgba(245,245,245,0.62)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        {altLocale === "zh" ? "中" : "EN"}
      </Link>
    </header>
  );
}
