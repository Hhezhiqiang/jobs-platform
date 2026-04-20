import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Salary Insights - Industry Salary Analysis & Calculator" : "薪资洞察分析 | 行业薪资水平与城市分布",
    description: isEn
      ? "Salary analysis reports based on real job data. Understand industry salary levels, city distributions, and trends. Smart salary calculator to evaluate your market value."
      : "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。提供智能薪资计算器，帮您评估市场价值。",
    keywords: isEn
      ? ["salary analysis", "industry salary", "city salary", "salary trends", "salary calculator", "wage level", "compensation report"]
      : ["薪资分析", "行业薪资", "城市薪资", "薪资趋势", "薪资计算器", "工资水平", "薪酬报告"],
    openGraph: {
      title: isEn ? "Salary Insights - Industry Salary Analysis & Calculator" : "薪资洞察分析 | 行业薪资水平与城市分布",
      description: isEn
        ? "Salary analysis reports based on real job data."
        : "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。",
      type: "website",
      url: `${SITE_URL}/${locale}/salary-insights`,
    },
    twitter: {
      card: "summary_large_image",
      title: isEn ? "Salary Insights - Industry Salary Analysis & Calculator" : "薪资洞察分析 | 行业薪资水平与城市分布",
      description: isEn
        ? "Salary analysis reports based on real job data."
        : "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。",
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/salary-insights`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/salary-insights`,
        "en": `${SITE_URL}/en/salary-insights`,
        "x-default": `${SITE_URL}/zh/salary-insights`,
      },
    },
  };
}

export default function SalaryInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
