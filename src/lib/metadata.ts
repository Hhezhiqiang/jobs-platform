import { Metadata } from "next";
import { jobs, companies } from "@prisma/client";
import { formatSalary } from "./utils";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
const SITE_DESCRIPTION = "专业的求职招聘平台，汇聚海量优质Web3、互联网、科技行业职位，为求职者和企业提供高效对接服务，助力职场发展";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

// 首页 Metadata（极致关键词覆盖）
export function generateHomeMetadata(locale = "zh"): Metadata {
  const isEn = locale === "en";
  const title = isEn
    ? `${SITE_NAME} - Professional Job Recruitment Platform, Web3 & Tech Jobs`
    : `${SITE_NAME} - 专业求职招聘平台，汇聚Web3、互联网高薪职位`;
  const desc = isEn
    ? "A professional job recruitment platform connecting top talent with Web3, internet, and tech companies worldwide. Empower your career growth."
    : SITE_DESCRIPTION;

  return {
    title,
    description: desc,
    keywords: isEn
      ? [
          "jobs", "recruitment", "career", "job search", "hiring",
          "Web3 jobs", "tech jobs", "internet jobs", "remote jobs",
          "software engineer jobs", "product manager jobs", "designer jobs",
          "data analyst jobs", "AI jobs", "high salary jobs",
          "career development", "interview tips", "resume optimization",
        ]
      : [
          // 核心词
          "招聘", "求职", "找工作", "人才网", "招聘信息", "职位搜索",
          // 行业词
          "Web3招聘", "互联网招聘", "科技行业招聘", "程序员招聘", "产品经理招聘",
          "运营招聘", "设计师招聘", "数据分析师招聘", "AI招聘",
          // 长尾词
          "高薪职位", "职业发展", "面试技巧", "薪资查询", "简历优化",
          "内推", "远程工作", "远程职位", "居家办公职位",
        ],
    openGraph: {
      title,
      description: desc,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      locale: isEn ? "en_US" : "zh_CN",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        "zh-CN": `${SITE_URL}/zh`,
        "en": `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/zh`,
      },
    },
  };
}

// 职位详情页 Metadata（SEO 极致优化版）
export function generateJobMetadata(job: jobs & { companies: companies }): Metadata {
  const salaryStr = formatSalary(job.salaryMin, job.salaryMax);
  const title = job.metaTitle || `${job.title}招聘 - ${job.companies.name} | ${salaryStr ? salaryStr + ' | ' : ''}${job.location} | ${SITE_NAME}`;
  const description = job.metaDescription ||
    `${job.companies.name}招聘${job.title}，工作地点：${job.location}${job.isRemote ? '（支持远程）' : ''}，薪资：${salaryStr || '面议'}。${job.description ? job.description.slice(0, 100) + '。' : ''}点击查看详情并立即申请。`;

  const url = `${SITE_URL}/jobs/${job.slug}`;

  // 极致关键词覆盖
  const jobKeywords = [
    job.title,
    job.title + "招聘",
    job.title + "职位",
    job.companies.name,
    job.companies.name + "招聘",
    "招聘",
    "求职",
    "找工作",
    job.city || job.location,
    job.city ? job.city + "招聘" : null,
    job.isRemote ? "远程工作" : null,
    job.isRemote ? "远程职位" : null,
    job.employmentType === "FULL_TIME" ? "全职" : job.employmentType === "PART_TIME" ? "兼职" : null,
    salaryStr,
  ].filter((k): k is string => !!k && k.length > 0);
  // 去重
  const uniqueKeywords = [...new Set(jobKeywords)];

  return {
    title,
    description: description.slice(0, 160),
    keywords: uniqueKeywords,
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: job.datePosted.toISOString(),
      modifiedTime: job.updatedAt.toISOString(),
      images: job.imageUrl ? [job.imageUrl] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: job.imageUrl ? [job.imageUrl] : [DEFAULT_OG_IMAGE],
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
export function generateCompanyMetadata(company: companies): Metadata {
  const title = company.metaTitle || `${company.name}招聘 - 最新职位 | ${company.industry || '互联网'}行业 | ${SITE_NAME}`;
  const description = company.metaDescription ||
    `${company.name}${company.industry ? `，${company.industry}行业` : ""}招聘主页。${company.description ? company.description.slice(0, 80) : '查看最新职位信息，了解公司详情。'}了解更多并申请。`;

  const url = `${SITE_URL}/companies/${company.slug}`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [
      company.name,
      company.name + "招聘",
      company.name + "职位",
      "招聘",
      "公司",
      company.industry,
      company.location,
    ].filter((k): k is string => !!k && k.length > 0),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: SITE_NAME,
      type: "profile",
      images: company.logo ? [company.logo] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: company.logo ? [company.logo] : [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// 职位列表页 Metadata（SEO 强化版）
export function generateJobsListMetadata(params?: { city?: string; type?: string; query?: string }): Metadata {
  const cityText = params?.city ? `${params.city} ` : "";
  const typeText = params?.type ? `${params.type} ` : "";
  const queryText = params?.query ? `${params.query} ` : "";

  const title = queryText
    ? `${queryText}招聘信息 - 职位搜索结果 | ${SITE_NAME}`
    : `${cityText}${typeText}招聘信息 - 最新职位列表 | ${SITE_NAME}`;

  const description = queryText
    ? `搜索"${queryText}"相关职位，查看最新的${queryText}招聘信息。高薪岗位实时更新，快速找到理想工作。`
    : `查看${cityText}${typeText}最新招聘信息，包含各行业热门职位。高薪岗位实时更新，快速找到理想工作。`;

  const allKeywords = ["招聘", "求职", "找工作", "工作机会", cityText, typeText, queryText, "最新职位", "高薪职位", "互联网招聘"].filter((k): k is string => !!k);
  // 去重
  const uniqueKeywords = [...new Set(allKeywords)];

  return {
    title,
    description,
    keywords: uniqueKeywords,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/jobs`,
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
    robots: {
      index: true,
      follow: true,
    },
  };
}

