"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerLinks.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                {t(group.titleKey)}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-base text-gray-500 hover:text-gray-900">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-base text-gray-400 text-center">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
