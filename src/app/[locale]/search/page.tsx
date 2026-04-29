import { Metadata } from "next";
import { SearchPageClient } from "./search-page-client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
    page?: string;
  }>;
}

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = "https://jobquip.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const params_ = await searchParams;
  const query = params_.q || "";

  const title = query
    ? `"${query}" 的搜索结果 - 职位搜索 | ${SITE_NAME}`
    : `搜索职位 - 找工作 | ${SITE_NAME}`;
  const description = query
    ? `搜索 "${query}" 找到的相关职位，包括职位详情、公司信息、薪资待遇等。海量职位实时更新。`
    : "搜索全站职位，支持按关键词、城市、职位类型、薪资范围筛选。快速找到你的理想工作。";

  const canonicalParams = new URLSearchParams();
  if (params_.q) canonicalParams.set("q", params_.q);
  if (params_.city) canonicalParams.set("city", params_.city);
  if (params_.type) canonicalParams.set("type", params_.type);
  if (params_.minSalary) canonicalParams.set("minSalary", params_.minSalary);
  if (params_.maxSalary) canonicalParams.set("maxSalary", params_.maxSalary);
  const canonical = `${SITE_URL}/${locale}/search${canonicalParams.toString() ? "?" + canonicalParams.toString() : ""}`;

  return {
    title,
    description,
    keywords: ["职位搜索", "找工作", query, params_.city, params_.type, "招聘信息"].filter((k): k is string => !!k),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/search`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const params_ = await searchParams;
  const rawPage = parseInt(params_.page || "1", 10);
  const safePage = isNaN(rawPage) ? 1 : Math.max(1, rawPage);

  return (
    <SearchPageClient
      initialQuery={params_.q || ""}
      initialCity={params_.city || "all"}
      initialType={params_.type || "all"}
      initialMinSalary={params_.minSalary || ""}
      initialMaxSalary={params_.maxSalary || ""}
      initialPage={safePage}
      locale={locale}
    />
  );
}
