import { Job, Company } from "@prisma/client";

// JobPosting Schema 生成（Google for Jobs 支持）
export function generateJobPostingSchema(job: Job & { company: Company }) {
  const siteUrl = "https://jobs-platform-gold.vercel.app";
  
  const baseSalary = job.salaryMin && job.salaryMax ? {
    "@type": "MonetaryAmount",
    currency: job.salaryCurrency,
    value: {
      "@type": "QuantitativeValue",
      minValue: job.salaryMin,
      maxValue: job.salaryMax,
      unitText: job.salaryPeriod === "YEAR" ? "YEAR" : "MONTH",
    },
  } : undefined;

  const jobLocation = {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: job.city || job.location,
      addressCountry: job.country,
    },
  };

  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    CONTRACT: "CONTRACT",
    INTERNSHIP: "INTERN",
    FREELANCE: "CONTRACTOR",
  };

  // 清理 description 中的 HTML 标签
  const cleanDescription = job.description
    .replace(/<[^\u003e]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: cleanDescription,
    datePosted: job.datePosted.toISOString(),
    validThrough: job.validThrough?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: employmentTypeMap[job.employmentType] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.schemaOrganizationName || job.company.name,
      logo: job.schemaOrganizationLogo || job.company.logo,
      sameAs: job.company.website,
    },
    jobLocation: job.isRemote ? {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: job.country,
      },
      additionalProperty: {
        "@type": "PropertyValue",
        name: "jobLocationType",
        value: "TELECOMMUTE",
      },
    } : jobLocation,
    baseSalary,
    image: job.imageUrl,
    url: `${siteUrl}/jobs/${job.slug}`,
    identifier: {
      "@type": "PropertyValue",
      name: "jobId",
      value: job.id,
    },
  };
}

// Organization Schema 生成
export function generateOrganizationSchema(company: Company) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description,
    url: company.website,
    logo: company.logo,
    sameAs: company.website,
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

// WebSite Schema 生成
export function generateWebsiteSchema(siteUrl: string, siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/jobs?q={search_term_string}`,
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
