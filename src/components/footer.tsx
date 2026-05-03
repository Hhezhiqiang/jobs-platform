"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const t = useTranslations("footer");

  const footerLinks = [
    {
      titleKey: "about",
      links: [
        { labelKey: "aboutUs", href: `/${locale}/about` },
        { labelKey: "contactUs", href: `/${locale}/contact` },
        { labelKey: "joinUs", href: `/${locale}/jobs?q=JobQuip` },
      ],
    },
    {
      titleKey: "jobSeekers",
      links: [
        { labelKey: "searchJobs", href: `/${locale}/jobs` },
        { labelKey: "salaryInsights", href: `/${locale}/salary-insights` },
        { labelKey: "faq", href: `/${locale}/faq` },
      ],
    },
    {
      titleKey: "employers",
      links: [
        { labelKey: "postJob", href: `/${locale}/company/jobs/new` },
        { labelKey: "companySignup", href: `/${locale}/company/register` },
      ],
    },
    {
      titleKey: "legal",
      links: [
        { labelKey: "terms", href: `/${locale}/terms` },
        { labelKey: "privacy", href: `/${locale}/privacy` },
      ],
    },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <Link href={`/${locale}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
                J
              </div>
              <span className="text-lg font-bold text-gray-900">{t("siteName")}</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              {t("description") || "专业的求职招聘平台，汇聚 Web3、互联网、科技行业高薪职位。"}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              <a href="https://x.com/memedaokol" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all text-xs font-bold" aria-label="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://t.me/Web3Kairo" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-all" aria-label="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                {t(group.titleKey)}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-6">
              <Link href={`/${locale}/terms`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("terms")}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
