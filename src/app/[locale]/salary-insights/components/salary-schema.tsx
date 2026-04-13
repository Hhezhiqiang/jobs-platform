import Script from "next/script";

interface SalaryData {
  overview: {
    totalJobs: number;
    avgSalary: number;
    medianSalary: number;
    salaryRange: { min: number; max: number };
  };
  industry: Array<{
    industry: string;
    avgSalary: number;
    count: number;
  }>;
  city: Array<{
    city: string;
    avgSalary: number;
    count: number;
  }>;
}

interface SalarySchemaProps {
  data: SalaryData;
}

export function SalarySchema({ data }: SalarySchemaProps) {
  // 构建 Salary Schema (Occupation)
  const occupationSchema = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: "职位薪资分析",
    description: `基于${data.overview.totalJobs}个职位数据的薪资分析报告`,
    estimatedSalary: {
      "@type": "MonetaryAmount",
      currency: "CNY",
      value: {
        "@type": "QuantitativeValue",
        minValue: data.overview.salaryRange.min,
        maxValue: data.overview.salaryRange.max,
        unitText: "YEAR",
      },
    },
    occupationLocation: data.city.slice(0, 5).map((c) => ({
      "@type": "City",
      name: c.city,
    })),
  };

  // 构建 Dataset Schema
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "职位薪资数据集",
    description: "各行业、城市薪资水平统计数据集",
    creator: {
      "@type": "Organization",
      name: "Jobs Platform",
    },
    datePublished: new Date().toISOString(),
    license: "https://creativecommons.org/licenses/by/4.0/",
    distribution: {
      "@type": "DataDownload",
      contentUrl: "/api/salary-insights",
      encodingFormat: "JSON",
    },
    spatialCoverage: data.city.slice(0, 5).map((c) => ({
      "@type": "Place",
      name: c.city,
    })),
    variableMeasured: ["薪资", "职位数量", "行业", "城市"],
  };

  // 构建 WebPage Schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "薪资洞察分析 | Jobs Platform",
    description:
      "基于真实职位数据的薪资分析报告，了解各行业薪资水平、城市薪资分布及趋势变化。",
    url: "https://your-domain.com/salary-insights",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首页",
          item: "https://your-domain.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "薪资洞察",
          item: "https://your-domain.com/salary-insights",
        },
      ],
    },
    mainEntity: occupationSchema,
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "薪资数据是如何统计的？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "薪资数据基于平台发布的真实职位信息，仅统计有明确薪资范围的职位。每日自动更新，确保数据的时效性和准确性。",
        },
      },
      {
        "@type": "Question",
        name: "薪资计算器准确吗？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `薪资计算器基于${data.overview.totalJobs}个历史职位数据，结合工作经验、城市等因素进行估算。结果仅供参考，实际薪资可能因公司规模、个人能力等因素有所差异。`,
        },
      },
      {
        "@type": "Question",
        name: "哪些行业的薪资最高？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `根据最新数据，${data.industry[0]?.industry || "科技/互联网"}行业平均薪资最高，达到${data.industry[0]?.avgSalary ? `¥${(data.industry[0].avgSalary / 10000).toFixed(1)}万` : "较高水平"}/年。`,
        },
      },
    ],
  };

  const schemas = [webPageSchema, datasetSchema, faqSchema];

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`salary-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
