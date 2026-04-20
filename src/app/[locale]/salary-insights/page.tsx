import { Metadata } from "next";
import SalaryInsightsClient from "./salary-insights-client";
import { getSalaryInsightsData } from "@/lib/salary-insights";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? `Salary Insights - Industry Trends | ${SITE_NAME}` : `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
    description: isEn
      ? "Comprehensive salary analysis reports based on real job data. Understand industry salary levels, city distributions, and trends."
      : "基于平台真实职位数据，为您提供全面的薪资分析报告。了解行业薪资水平、城市薪资分布及趋势变化。",
    keywords: isEn
      ? ["salary insights", "industry salary", "city salary", "salary trends", "salary analysis", "salary report"]
      : ["薪资洞察", "行业薪资", "城市薪资", "薪资趋势", "薪资分析", "年薪报告"],
    openGraph: {
      title: isEn ? `Salary Insights - Industry Trends | ${SITE_NAME}` : `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
      description: isEn
        ? "Comprehensive salary analysis reports based on real job data."
        : "基于平台真实职位数据，为您提供全面的薪资分析报告。",
      url: `${SITE_URL}/${locale}/salary-insights`,
      siteName: SITE_NAME,
      type: "website",
      locale: isEn ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: isEn ? `Salary Insights - Industry Trends | ${SITE_NAME}` : `薪资洞察分析 - 行业薪资趋势 | ${SITE_NAME}`,
      description: isEn
        ? "Comprehensive salary analysis reports based on real job data."
        : "基于平台真实职位数据，为您提供全面的薪资分析报告。",
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

export const revalidate = 3600;

export default async function SalaryInsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getSalaryInsightsData();

  return <SalaryInsightsClient initialData={data} />;
}
