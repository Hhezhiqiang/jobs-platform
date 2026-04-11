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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";
  
  return {
    title: query ? `"${query}" 的搜索结果 - 职位搜索` : "搜索职位 - 找工作",
    description: query 
      ? `搜索 "${query}" 找到的相关职位，包括职位详情、公司信息、薪资待遇等`
      : "搜索全站职位，支持按关键词、城市、职位类型、薪资范围筛选",
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
      initialPage={parseInt(params.page || "1")}
    />
  );
}
