"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COLS = [
  {
    head: { zh: "产品", en: "Product" },
    items: [
      { href: "jobs", zh: "职位", en: "Jobs" },
      { href: "companies", zh: "公司", en: "Companies" },
      { href: "salary-insights", zh: "薪资", en: "Salary" },
      { href: "career-trail", zh: "成长", en: "Trail" },
      { href: "topics", zh: "话题", en: "Topics" },
    ],
  },
  {
    head: { zh: "资源", en: "Resource" },
    items: [
      { href: "blog", zh: "博客", en: "Notes" },
      { href: "faq", zh: "常见问题", en: "FAQ" },
      { href: "job-demands", zh: "招聘需求", en: "Demands" },
      { href: "aggregated-jobs", zh: "聚合职位", en: "Aggregated" },
      { href: "rss.xml", zh: "RSS", en: "RSS" },
    ],
  },
  {
    head: { zh: "公司", en: "Company" },
    items: [
      { href: "about", zh: "关于", en: "About" },
      { href: "contact", zh: "联系", en: "Contact" },
      { href: "affiliate", zh: "推广", en: "Affiliate" },
      { href: "privacy", zh: "隐私", en: "Privacy" },
      { href: "terms", zh: "条款", en: "Terms" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const altLocale = locale === "zh" ? "en" : "zh";
  const altPath = pathname.replace(/^\/(zh|en)/, `/${altLocale}`);
  const year = new Date().getFullYear();

  if (pathname.includes("/admin") || pathname.includes("/dashboard")) return null;

  return (
    <footer
      className="volt-site-footer mt-24 border-t"
      style={{
        background: "#0a0a0a",
        borderColor: "rgba(255,255,255,0.08)",
        color: "#f5f5f5",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md grid place-items-center"
                style={{ background: "#B6FF3D", color: "#0a0a0a" }}
              >
                <span className="font-bold text-sm">J</span>
              </div>
              <span className="font-semibold tracking-tight">JobQuip</span>
            </div>
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "rgba(245,245,245,0.62)" }}
            >
              {locale === "zh"
                ? "为认真做事的人，提供认真的工作机会。Web3 与互联网高薪职位，实时聚合。"
                : "A new way to find Web3 & tech jobs. Built for makers who actually ship."}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { label: "X", href: "https://x.com/memedaokol?s=11" },
                { label: "TG", href: "https://t.me/jobquip" },
                { label: "in", href: "https://linkedin.com/company/jobquip" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="grid h-9 w-9 place-items-center rounded-full border text-xs transition-colors hover:text-white"
                  style={{
                    borderColor: "rgba(255,255,255,0.14)",
                    color: "rgba(245,245,245,0.62)",
                  }}
                >
                  {s.label}
                </a>
              ))}
              <Link
                href={altPath}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "rgba(245,245,245,0.62)",
                }}
              >
                {altLocale === "zh" ? "切到中文" : "Switch to EN"}
              </Link>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.head.en}>
              <h4
                className="mb-4 font-mono text-xs uppercase tracking-widest"
                style={{ color: "rgba(245,245,245,0.40)" }}
              >
                {locale === "zh" ? col.head.zh : col.head.en}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={`/${locale}/${it.href}`}
                      className="transition-colors hover:text-white"
                      style={{ color: "rgba(245,245,245,0.62)" }}
                    >
                      {locale === "zh" ? it.zh : it.en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col gap-3 border-t pt-6 text-xs md:flex-row md:items-center md:justify-between"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            color: "rgba(245,245,245,0.40)",
          }}
        >
          <div>
            © {year} JobQuip.{" "}
            {locale === "zh" ? "保留所有权利。" : "All systems nominal."}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#B6FF3D" }}
            />
            jobquip.com · 99.98% uptime
          </div>
        </div>
      </div>
    </footer>
  );
}
