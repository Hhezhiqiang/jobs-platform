"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const footerLinks = isEn
    ? [
        {
          title: "About",
          links: [
            { label: "About Us", href: `/${locale}/about` },
            { label: "Contact", href: `/${locale}/contact` },
            { label: "Join Us", href: `/${locale}/jobs?q=JobsBro` },
          ],
        },
        {
          title: "Job Seekers",
          links: [
            { label: "Search Jobs", href: `/${locale}/jobs` },
            { label: "Salary Insights", href: `/${locale}/salary-insights` },
            { label: "FAQ", href: `/${locale}/faq` },
          ],
        },
        {
          title: "Employers",
          links: [
            { label: "Post a Job", href: `/${locale}/company/jobs/new` },
            { label: "Company Sign-up", href: `/${locale}/company/register` },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Terms", href: `/${locale}/terms` },
            { label: "Privacy", href: `/${locale}/privacy` },
          ],
        },
      ]
    : [
        {
          title: "关于我们",
          links: [
            { label: "公司介绍", href: `/${locale}/about` },
            { label: "联系我们", href: `/${locale}/contact` },
            { label: "加入我们", href: `/${locale}/jobs?q=JobsBro` },
          ],
        },
        {
          title: "求职服务",
          links: [
            { label: "职位搜索", href: `/${locale}/jobs` },
            { label: "薪资洞察", href: `/${locale}/salary-insights` },
            { label: "常见问题", href: `/${locale}/faq` },
          ],
        },
        {
          title: "企业服务",
          links: [
            { label: "发布职位", href: `/${locale}/company/jobs/new` },
            { label: "企业入驻", href: `/${locale}/company/register` },
          ],
        },
        {
          title: "法律条款",
          links: [
            { label: "用户协议", href: `/${locale}/terms` },
            { label: "隐私政策", href: `/${locale}/privacy` },
          ],
        },
      ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-base text-gray-500 hover:text-gray-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-base text-gray-400 text-center">
            © {new Date().getFullYear()} {isEn ? "JobsBro. All rights reserved." : "JobsBro招聘平台. 版权所有."}
          </p>
        </div>
      </div>
    </footer>
  );
}
