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
const SITE_URL = "https://jobs-platform-gold.vercel.app";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";

  const title = query
    ? `"${query}" 的搜索结果 - 职位搜索 | ${SITE_NAME}`
    : `搜索职位 - 找工作 | ${SITE_NAME}`;
  const description = query
    ? `搜索 "${query}" 找到的相关职位，包括职位详情、公司信息、薪资待遇等。海量职位实时更新。`
    : "搜索全站职位，支持按关键词、城市、职位类型、薪资范围筛选。快速找到你的理想工作。";

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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/search`,
    },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <SearchPageClient
      initialQuery={params.q || ""}
      initialCity={params.city || "all"}
      initialType={params.type || "all"}
      initialMinSalary={params.minSalary || ""}
      initialMaxSalary={params.maxSalary || ""}
      initialPage={parseInt(params.page || "1", 10)}
    />
  );
}
