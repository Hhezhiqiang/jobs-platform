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
