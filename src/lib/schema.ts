import { Job, Company } from "@prisma/client";

// JobPosting Schema 生成（Google for Jobs 支持）
export function generateJobPostingSchema(job: Job & { company: Company }) {
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

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.datePosted.toISOString(),
    validThrough: job.validThrough?.toISOString(),
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
