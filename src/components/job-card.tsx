import Link from "next/link";
import Image from "next/image";
import { Job, Company } from "@prisma/client";
import { formatSalary, safeJsonLdStringify } from "@/lib/utils";

interface JobCardProps {
  job: Job & { company: Company };
  compact?: boolean;
}

export function JobCard({ job, compact = false }: JobCardProps) {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);

  // JobPosting Schema 数据
  const jobSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description?.slice(0, 200) || `${job.company.name}招聘${job.title}`,
    "datePosted": job.datePosted.toISOString(),
    "validThrough": job.validThrough?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": getEmploymentType(job.employmentType),
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company.name,
      "logo": job.company.logo || undefined,
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.city || job.location,
        "addressCountry": "CN",
      },
    },
    "baseSalary": job.salaryMin && job.salaryMax ? {
      "@type": "MonetaryAmount",
      "currency": job.salaryCurrency === "¥" ? "CNY" : job.salaryCurrency,
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salaryMin,
        "maxValue": job.salaryMax,
        "unitText": "MONTH",
      },
    } : undefined,
    "jobLocationType": job.isRemote ? "TELECOMMUTE" : undefined,
    "applicantLocationRequirements": job.isRemote ? {
      "@type": "Country",
      "name": "中国",
    } : undefined,
  };

  if (compact) {
    return (
      <Link
        href={`/jobs/${job.slug}`}
        className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        itemScope
        itemType="https://schema.org/JobPosting"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchema) }}
        />
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {job.company.logo ? (
                <Image
                  src={job.company.logo}
                  alt={`${job.company.name} Logo`}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                  {job.company.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900" itemProp="title">{job.title}</h3>
                <p className="text-sm text-gray-600" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                  <span itemProp="name">{job.company.name}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-blue-600" itemProp="baseSalary" itemScope itemType="https://schema.org/MonetaryAmount">
              <meta itemProp="currency" content={job.salaryCurrency === "¥" ? "CNY" : job.salaryCurrency} />
              <span itemProp="value">{salaryText}</span>
            </p>
            <p className="text-sm text-gray-500" itemProp="jobLocation" itemScope itemType="https://schema.org/Place">
              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <span itemProp="addressLocality">{job.location}</span>
              </span>
            </p>
          </div>
        </div>
        <meta itemProp="datePosted" content={job.datePosted.toISOString()} />
        <meta itemProp="employmentType" content={getEmploymentType(job.employmentType)} />
      </Link>
    );
  }

  return (
    <article
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      itemScope
      itemType="https://schema.org/JobPosting"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchema) }}
      />
      
      {job.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={job.imageUrl}
            alt={`${job.title} - 职位图片`}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <Link href={`/jobs/${job.slug}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {job.company.logo ? (
              <Image
                src={job.company.logo}
                alt={`${job.company.name} Logo`}
                width={50}
                height={50}
                className="rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                {job.company.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg text-gray-900" itemProp="title">{job.title}</h3>
              <p className="text-sm text-gray-600" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">{job.company.name}</span>
              </p>
            </div>
          </div>
          
          {job.isFeatured && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
              🔥 热招
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
          <span itemProp="jobLocation" itemScope itemType="https://schema.org/Place">
            <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <span itemProp="addressLocality">{job.location}</span>
            </span>
          </span>
          <span>·</span>
          <span itemProp="employmentType">{job.employmentType}</span>
          {job.isRemote && (
            <>
              <span>·</span>
              <span className="text-green-600">远程办公</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-600" itemProp="baseSalary" itemScope itemType="https://schema.org/MonetaryAmount">
            <meta itemProp="currency" content={job.salaryCurrency === "¥" ? "CNY" : job.salaryCurrency} />
            <span itemProp="value">{salaryText}</span>
          </span>
          <time 
            className="text-sm text-gray-400"
            itemProp="datePosted"
            dateTime={job.datePosted.toISOString()}
          >
            {new Date(job.datePosted).toLocaleDateString("zh-CN")}
          </time>
        </div>
      </Link>
    </article>
  );
}

// 转换雇佣类型为 Schema.org 标准格式
function getEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    "全职": "FULL_TIME",
    "FULL_TIME": "FULL_TIME",
    "兼职": "PART_TIME",
    "PART_TIME": "PART_TIME",
    "实习": "INTERN",
    "INTERN": "INTERN",
    "合同": "CONTRACTOR",
    "CONTRACT": "CONTRACTOR",
    "临时": "TEMPORARY",
    "TEMPORARY": "TEMPORARY",
  };
  return typeMap[type] || "FULL_TIME";
}
