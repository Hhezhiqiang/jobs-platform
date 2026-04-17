import { Metadata } from "next";
import SalaryInsightsClient from "./salary-insights-client";
import { getSalaryInsightsData } from "@/lib/salary-insights";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export const metadata: Metadata = {
  title: `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
  description: "基于平台真实职位数据，为您提供全面的薪资分析报告。了解行业薪资水平、城市薪资分布及趋势变化。",
  keywords: ["薪资洞察", "行业薪资", "城市薪资", "薪资趋势", "薪资分析", "年薪报告"],
  openGraph: {
    title: `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
    description: "基于平台真实职位数据，为您提供全面的薪资分析报告。",
    url: `${SITE_URL}/salary-insights`,
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
    description: "基于平台真实职位数据，为您提供全面的薪资分析报告。",
  },
  alternates: {
    canonical: `${SITE_URL}/salary-insights`,
  },
};

export const revalidate = 3600;

export default async function SalaryInsightsPage() {
  const data = await getSalaryInsightsData();

  return <SalaryInsightsClient initialData={data} />;
}
