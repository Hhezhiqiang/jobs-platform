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
              <span className="text-lg font-bold text-gray-900">{t("siteName") || "JobQuip"}</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              {t("description") || "专业的求职招聘平台，汇聚 Web3、互联网、科技行业高薪职位。"}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-all text-xs font-bold">
                X
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-all text-xs font-bold">
                in
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 hover:text-gray-700 flex items-center justify-center text-gray-400 transition-all text-xs font-bold">
                GH
              </a>
              <a href={`/${locale}/contact`} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-all">
                <Mail className="w-4 h-4" />
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
