import { Metadata } from "next";
import { Job, Company } from "@prisma/client";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "专业的求职招聘平台";

// 首页 Metadata
export function generateHomeMetadata(): Metadata {
  return {
    title: `${SITE_NAME} - 专业求职招聘平台`,
    description: SITE_DESCRIPTION,
    keywords: ["招聘", "求职", "找工作", "人才网", "招聘信息"],
    openGraph: {
      title: `${SITE_NAME} - 专业求职招聘平台`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - 专业求职招聘平台`,
      description: SITE_DESCRIPTION,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}

// 职位详情页 Metadata
export function generateJobMetadata(job: Job & { company: Company }): Metadata {
  const title = job.metaTitle || `${job.title} | ${job.company.name}招聘 | ${SITE_NAME}`;
  const description = job.metaDescription || 
    `${job.company.name}招聘${job.title}，工作地点：${job.location}，${job.salaryMin ? `薪资：${job.salaryMin}-${job.salaryMax}${job.salaryCurrency}` : "薪资面议"}。点击查看详情并申请。`;
  
  const url = `${SITE_URL}/jobs/${job.slug}`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [job.title, job.company.name, "招聘", "求职", job.city || job.location].filter((k): k is string => !!k),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: job.datePosted.toISOString(),
      modifiedTime: job.updatedAt.toISOString(),
      images: job.imageUrl ? [job.imageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: job.imageUrl ? [job.imageUrl] : [],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: job.status === "ACTIVE",
      follow: job.status === "ACTIVE",
    },
  };
}

// 公司页 Metadata
export function generateCompanyMetadata(company: Company): Metadata {
  const title = company.metaTitle || `${company.name} - 公司招聘主页 | ${SITE_NAME}`;
  const description = company.metaDescription || 
    `${company.name}${company.industry ? `，${company.industry}行业` : ""}招聘主页。查看最新职位信息，了解公司详情。`;
  
  const url = `${SITE_URL}/companies/${company.slug}`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [company.name, "招聘", "公司", company.industry].filter((k): k is string => !!k),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: SITE_NAME,
      type: "profile",
      images: company.logo ? [company.logo] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

// 职位列表页 Metadata
export function generateJobsListMetadata(params?: { city?: string; type?: string }): Metadata {
  const cityText = params?.city ? `${params.city} ` : "";
  const typeText = params?.type ? `${params.type} ` : "";
  
  const title = `${cityText}${typeText}招聘信息 - 最新职位列表 | ${SITE_NAME}`;
  const description = `查看${cityText}${typeText}最新招聘信息，包含各行业热门职位。高薪岗位实时更新，快速找到理想工作。`;

  return {
    title,
    description,
    keywords: ["招聘", "求职", cityText, typeText, "工作机会"].filter((k): k is string => !!k),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}
