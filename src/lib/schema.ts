import { jobs, companies } from "@prisma/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

// JobPosting Schema 生成（Google for Jobs 支持）
export function generateJobPostingSchema(job: jobs & { companies: companies }) {
  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: "FULLTIME",
    PART_TIME: "PARTTIME",
    CONTRACT: "CONTRACTOR",
    INTERNSHIP: "INTERN",
    FREELANCE: "CONTRACTOR",
  };

  const validThrough = job.validThrough
    ? new Date(job.validThrough).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const baseSalary = job.salaryMin || job.salaryMax
    ? {
        "@type": "MonetaryAmount" as const,
        currency: job.salaryCurrency || "CNY",
        value: {
          "@type": "QuantitativeValue" as const,
          minValue: job.salaryMin || undefined,
          maxValue: job.salaryMax || undefined,
          unitText: job.salaryPeriod === "YEAR" ? "YEAR" : "MONTH",
        },
      }
    : undefined;

  const cleanDescription = (job.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: cleanDescription,
    datePosted: new Date(job.datePosted).toISOString(),
    validThrough,
    employmentType: employmentTypeMap[job.employmentType] || "FULLTIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.schemaOrganizationName || job.companies.name,
      logo: job.schemaOrganizationLogo || job.companies.logo || undefined,
      url: `${SITE_URL}/companies/${job.companies.slug}`,
    },
    jobLocation: job.isRemote
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressCountry: job.country || "CN",
          },
          additionalProperty: {
            "@type": "PropertyValue",
            name: "jobLocationType",
            value: "TELECOMMUTE",
          },
        }
      : {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.city || job.location || "未知",
            addressCountry: job.country || "CN",
          },
        },
    baseSalary,
    url: `${SITE_URL}/jobs/${job.slug}`,
    identifier: {
      "@type": "PropertyValue",
      name: job.companies.name,
      value: job.id,
    },
  };
}

// Organization Schema 生成
export function generateOrganizationSchema(company: companies) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description || undefined,
    url: `${SITE_URL}/companies/${company.slug}`,
    logo: company.logo || undefined,
    sameAs: company.website || undefined,
  };
}

// BreadcrumbList Schema 生成
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// WebSite Schema 生成（带站内搜索框）
export function generateWebsiteSchema(siteUrl: string = SITE_URL, siteName: string = "JobsBro招聘平台") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// FAQ Schema 生成（用于职位页面常见问题）
export function generateFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

// HowTo Schema 生成（用于博客教程类文章）
export function generateHowToSchema(data: {
  name: string;
  description: string;
  image?: string;
  estimatedCost?: string;
  totalTime?: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    image: data.image,
    estimatedCost: data.estimatedCost,
    totalTime: data.totalTime,
    step: data.steps.map((s) => ({
      "@type": "HowToStep",
      name: s.name,
      text: s.text,
      image: s.image,
    })),
  };
}

// ItemList Schema 生成（用于职位列表、公司列表等集合页面）
export function generateItemListSchema<T extends { name?: string; title?: string; url: string; description?: string; image?: string }>(
  items: T[],
  itemListName: string,
  itemListDescription?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: itemListName,
    description: itemListDescription,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "JobPosting",
        name: item.name || item.title || "",
        url: item.url,
        description: item.description,
        image: item.image,
      },
    })),
  };
}

// Article Schema 生成（AI 友好版本，包含作者/专家背书）
export function generateArticleSchema(data: {
  headline: string;
  description: string;
  image?: string;
  author: { name: string; url?: string; jobTitle?: string; sameAs?: string[] };
  publisher?: { name: string; logo?: string };
  datePublished: string;
  dateModified: string;
  keywords?: string[];
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    image: data.image,
    author: {
      "@type": "Person",
      name: data.author.name,
      url: data.author.url,
      jobTitle: data.author.jobTitle,
      sameAs: data.author.sameAs,
    },
    publisher: data.publisher
      ? {
          "@type": "Organization",
          name: data.publisher.name,
          logo: data.publisher.logo
            ? { "@type": "ImageObject", url: data.publisher.logo }
            : undefined,
        }
      : undefined,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    keywords: data.keywords?.join(", "),
    url: data.url,
    mainEntityOfPage: data.url,
  };
}

// Review/Rating Schema 生成（用于公司评价）
export function generateReviewSchema(data: {
  itemName: string;
  itemUrl: string;
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  reviewCount?: number;
  authorName: string;
  reviewBody?: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Organization",
      name: data.itemName,
      url: data.itemUrl,
    },
    reviewRating: {
      "@type": "AggregateRating",
      ratingValue: data.ratingValue,
      bestRating: data.bestRating || 5,
      worstRating: data.worstRating || 1,
      ratingCount: data.reviewCount || 1,
    },
    author: {
      "@type": "Person",
      name: data.authorName,
    },
    reviewBody: data.reviewBody,
    datePublished: data.datePublished,
  };
}
