import Link from "next/link";

const footerLinks = [
  {
    title: "关于我们",
    links: [
      { label: "公司介绍", href: "/about" },
      { label: "联系我们", href: "/contact" },
      { label: "加入我们", href: "/jobs?query=JobsBro" },
    ],
  },
  {
    title: "求职服务",
    links: [
      { label: "职位搜索", href: "/jobs" },
      { label: "薪资洞察", href: "/salary-insights" },
      { label: "常见问题", href: "/faq" },
    ],
  },
  {
    title: "企业服务",
    links: [
      { label: "发布职位", href: "/company/jobs/new" },
      { label: "企业入驻", href: "/company/register" },
    ],
  },
  {
    title: "法律条款",
    links: [
      { label: "用户协议", href: "/terms" },
      { label: "隐私政策", href: "/privacy" },
    ],
  },
];

export function Footer() {
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
            © {new Date().getFullYear()} JobsBro招聘平台. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
