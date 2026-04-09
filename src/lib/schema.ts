// 灵活的职位类型
interface JobData {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: string;
  location: string;
  city?: string | null;
  country?: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  datePosted: Date | string;
  validThrough?: Date | string | null;
  imageUrl?: string | null;
  schemaOrganizationName?: string | null;
  schemaOrganizationLogo?: string | null;
  company: {
    name: string;
    logo?: string | null;
    website?: string | null;
  };
}

// 灵活的公司类型
interface CompanyData {
  name: string;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
}

// JobPosting Schema 生成（Google for Jobs 支持）
export function generateJobPostingSchema(job: JobData) {
  const baseSalary = job.salaryMin && job.salaryMax ? {
    "@type": "MonetaryAmount",
    currency: job.salaryCurrency || "CNY",
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
      addressCountry: job.country || "CN",
    },
  };

  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    CONTRACT: "CONTRACT",
    INTERNSHIP: "INTERN",
    FREELANCE: "CONTRACTOR",
  };

  const datePosted = typeof job.datePosted === 'string' 
    ? job.datePosted 
    : job.datePosted.toISOString();

  const validThrough = job.validThrough 
    ? (typeof job.validThrough === 'string' ? job.validThrough : job.validThrough.toISOString())
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted,
    validThrough,
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
        addressCountry: job.country || "CN",
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
export function generateOrganizationSchema(company: CompanyData) {
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
