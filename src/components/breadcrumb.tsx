"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";

  return (
    <nav aria-label="面包屑导航">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <Link 
            href={`/${locale}/`} 
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            aria-label="首页"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            {item.href ? (
              <Link 
                href={item.href.startsWith("/") && !item.href.startsWith(`/${locale}`)
                  ? `/${locale}${item.href}`
                  : item.href}
                className="hover:text-blue-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// 预定义的面包屑配置（注意：这些会在组件中自动添加 locale 前缀）
export const jobBreadcrumb = (title?: string) => [
  { label: "职位列表", href: "/jobs" },
  ...(title ? [{ label: title }] : []),
];

export const companyBreadcrumb = (name?: string) => [
  { label: "公司列表", href: "/companies" },
  ...(name ? [{ label: name }] : []),
];

export const blogBreadcrumb = (title?: string) => [
  { label: "博客", href: "/blog" },
  ...(title ? [{ label: title }] : []),
];

export const dashboardBreadcrumb = (section?: string) => [
  { label: "个人中心", href: "/dashboard" },
  ...(section ? [{ label: section }] : []),
];
