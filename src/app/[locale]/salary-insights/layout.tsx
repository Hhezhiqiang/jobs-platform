import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "薪资洞察分析 | 行业薪资水平与城市分布",
  description:
    "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。提供智能薪资计算器，帮您评估市场价值。",
  keywords: [
    "薪资分析",
    "行业薪资",
    "城市薪资",
    "薪资趋势",
    "薪资计算器",
    "工资水平",
    "薪酬报告",
  ],
  openGraph: {
    title: "薪资洞察分析 | 行业薪资水平与城市分布",
    description:
      "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。",
    type: "website",
    url: "/salary-insights",
  },
  twitter: {
    card: "summary_large_image",
    title: "薪资洞察分析 | 行业薪资水平与城市分布",
    description:
      "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。",
  },
  alternates: {
    canonical: "/salary-insights",
  },
};

export default function SalaryInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
