import { Metadata } from "next";
import { SearchPageClient } from "./search-page-client";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
    page?: string;
  }>;
}

const SITE_NAME = "JobsBro招聘平台";
const SITE_URL = "https://jobquip.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";

  const title = query
    ? `"${query}" 的搜索结果 - 职位搜索 | ${SITE_NAME}`
    : `搜索职位 - 找工作 | ${SITE_NAME}`;
  const description = query
    ? `搜索 "${query}" 找到的相关职位，包括职位详情、公司信息、薪资待遇等。海量职位实时更新。`
    : "搜索全站职位，支持按关键词、城市、职位类型、薪资范围筛选。快速找到你的理想工作。";

  const canonicalParams = new URLSearchParams();
  if (params.q) canonicalParams.set("q", params.q);
  if (params.city) canonicalParams.set("city", params.city);
  if (params.type) canonicalParams.set("type", params.type);
  if (params.minSalary) canonicalParams.set("minSalary", params.minSalary);
  if (params.maxSalary) canonicalParams.set("maxSalary", params.maxSalary);
  const canonical = `${SITE_URL}/search${canonicalParams.toString() ? "?" + canonicalParams.toString() : ""}`;

  return {
    title,
    description,
    keywords: ["职位搜索", "找工作", query, params.city, params.type, "招聘信息"].filter((k): k is string => !!k),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/search`,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
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

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = parseInt(params.page || "1", 10);
  const safePage = isNaN(rawPage) ? 1 : Math.max(1, rawPage);

  return (
    <SearchPageClient
      initialQuery={params.q || ""}
      initialCity={params.city || "all"}
      initialType={params.type || "all"}
      initialMinSalary={params.minSalary || ""}
      initialMaxSalary={params.maxSalary || ""}
      initialPage={safePage}
    />
  );
}
