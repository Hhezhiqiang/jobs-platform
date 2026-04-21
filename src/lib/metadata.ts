import { Metadata } from "next";
import { jobs, companies } from "@prisma/client";
import { formatSalary } from "./utils";

const SITE_NAME = "JobQuip";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

const i18n = {
  zh: {
    siteDesc: "专业的求职招聘平台，汇聚海量优质Web3、互联网、科技行业职位，为求职者和企业提供高效对接服务，助力职场发展",
    siteKeywords: ["招聘", "求职", "找工作", "人才网", "招聘信息", "职位搜索", "Web3招聘", "互联网招聘", "高薪职位", "职业发展"],
  },
  en: {
    siteDesc: "A professional job recruitment platform connecting top talent with Web3, internet, and tech companies worldwide. Empower your career growth.",
    siteKeywords: ["jobs", "recruitment", "career", "job search", "hiring", "Web3 jobs", "tech jobs", "internet jobs", "remote jobs", "high salary jobs"],
  },
};

// 首页 Metadata
export function generateHomeMetadata(locale = "zh"): Metadata {
  const t = i18n[locale === "en" ? "en" : "zh"];
  const title = locale === "en"
    ? `${SITE_NAME} - Professional Job Recruitment Platform, Web3 & Tech Jobs`
    : `${SITE_NAME} - 专业求职招聘平台，汇聚Web3、互联网高薪职位`;
  return {
    title,
    description: t.siteDesc,
    keywords: locale === "en"
      ? [...t.siteKeywords, "software engineer jobs", "product manager jobs", "designer jobs", "data analyst jobs", "AI jobs", "career development", "interview tips", "resume optimization"]
      : [...t.siteKeywords, "程序员招聘", "产品经理招聘", "运营招聘", "设计师招聘", "数据分析师招聘", "AI招聘", "职业发展", "面试技巧", "薪资查询", "简历优化", "内推", "远程工作", "远程职位", "居家办公职位"],
    openGraph: {
      title,
      description: t.siteDesc,
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t.siteDesc,
      images: [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh`,
        "en": `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/zh`,
      },
    },
  };
}

// 职位详情页 Metadata
export function generateJobMetadata(job: jobs & { companies: companies }, locale = "zh"): Metadata {
  const salaryStr = formatSalary(job.salaryMin, job.salaryMax);
  const isEn = locale === "en";
  const title = job.metaTitle || (isEn
    ? `${job.title} at ${job.companies.name}${salaryStr ? ' | ' + salaryStr : ''}${job.location ? ' | ' + job.location : ''}`
    : `${job.title}招聘 - ${job.companies.name}${salaryStr ? ' | ' + salaryStr : ''}${job.location ? ' | ' + job.location : ''}`);
  const description = job.metaDescription || (isEn
    ? `${job.companies.name} is hiring for ${job.title} in ${job.location}${job.isRemote ? ' (Remote)' : ''}. Salary: ${salaryStr || 'Negotiable'}. View details and apply now.`
    : `${job.companies.name}招聘${job.title}，工作地点：${job.location}${job.isRemote ? '（支持远程）' : ''}，薪资：${salaryStr || '面议'}。点击查看详情并立即申请。`);

  const url = `${SITE_URL}/${locale}/jobs/${job.slug}`;

  const jobKeywords = [
    job.title,
    isEn ? `${job.title} job` : `${job.title}招聘`,
    job.companies.name,
    isEn ? `${job.companies.name} hiring` : `${job.companies.name}招聘`,
    isEn ? "jobs" : "招聘",
    isEn ? "career" : "求职",
    isEn ? "job search" : "找工作",
    job.city || job.location,
    job.isRemote ? (isEn ? "remote work" : "远程工作") : null,
    job.employmentType === "FULL_TIME" ? (isEn ? "full-time" : "全职") : null,
    salaryStr,
  ].filter((k): k is string => !!k && k.length > 0);
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
      images: job.imageUrl ? [job.imageUrl] : [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: job.imageUrl ? [job.imageUrl] : [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": url.replace(`/${locale}/`, '/zh/'),
        "en": url.replace(`/${locale}/`, '/en/'),
        "x-default": url.replace(`/${locale}/`, '/zh/'),
      },
    },
    robots: {
      index: job.status === "ACTIVE",
      follow: job.status === "ACTIVE",
    },
  };
}

// 公司页 Metadata
export function generateCompanyMetadata(company: companies, locale = "zh"): Metadata {
  const isEn = locale === "en";
  const title = company.metaTitle || (isEn
    ? `${company.name} Careers - Latest Jobs | ${company.industry || 'Tech'}`
    : `${company.name}招聘 - 最新职位 | ${company.industry || '互联网'}行业`);
  const description = company.metaDescription || (isEn
    ? `${company.name}${company.industry ? `, ${company.industry} industry` : ""}. ${company.description ? company.description.slice(0, 80) : 'View latest job openings.'}`
    : `${company.name}${company.industry ? `，${company.industry}行业` : ""}招聘主页。${company.description ? company.description.slice(0, 80) : '查看最新职位信息，了解公司详情。'}`);

  const url = `${SITE_URL}/${locale}/companies/${company.slug}`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [
      company.name,
      isEn ? `${company.name} careers` : `${company.name}招聘`,
      isEn ? "jobs" : "招聘",
      company.industry,
      company.location,
    ].filter((k): k is string => !!k && k.length > 0),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: SITE_NAME,
      type: "profile",
      images: company.logo ? [company.logo] : [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: company.logo ? [company.logo] : [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": url.replace(`/${locale}/`, '/zh/'),
        "en": url.replace(`/${locale}/`, '/en/'),
        "x-default": url.replace(`/${locale}/`, '/zh/'),
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// 职位列表页 Metadata
export function generateJobsListMetadata(params?: { city?: string; type?: string; query?: string }, locale = "zh"): Metadata {
  const isEn = locale === "en";
  const cityText = params?.city ? `${params.city} ` : "";
  const typeText = params?.type ? `${params.type} ` : "";
  const queryText = params?.query ? `${params.query} ` : "";

  const title = queryText
    ? (isEn ? `"${queryText}" Jobs - Search Results` : `${queryText}招聘信息 - 职位搜索结果`)
    : (isEn ? `${cityText}${typeText}Jobs - Latest Listings` : `${cityText}${typeText}招聘信息 - 最新职位列表`);

  const description = queryText
    ? (isEn ? `Search for "${queryText}" jobs and view the latest openings.` : `搜索"${queryText}"相关职位，查看最新的${queryText}招聘信息。`)
    : (isEn ? `Browse the latest ${cityText}${typeText}job listings.` : `查看${cityText}${typeText}最新招聘信息。`);

  return {
    title,
    description,
    keywords: isEn
      ? ["jobs", "recruitment", "career", cityText, typeText, queryText, "latest jobs"].filter(Boolean)
      : ["招聘", "求职", "找工作", "工作机会", cityText, typeText, queryText, "最新职位", "高薪职位"].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/jobs`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/logo.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/jobs`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/jobs`,
        "en": `${SITE_URL}/en/jobs`,
        "x-default": `${SITE_URL}/zh/jobs`,
      },
    },
  };
}
