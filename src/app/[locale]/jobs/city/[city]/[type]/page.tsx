import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { JobCardV2 } from "@/components/job-card-v2";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "JobQuip招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

// 职位类型映射
const JOB_TYPES: Record<string, { label: string; desc: string; icon: string }> = {
  FULL_TIME: {
    label: "全职",
    desc: "稳定全职岗位，提供完善福利保障，适合追求职业发展的求职者",
    icon: "💼",
  },
  PART_TIME: {
    label: "兼职",
    desc: "灵活兼职机会，时间自由安排，适合学生或想增加收入的职场人",
    icon: "⏰",
  },
  CONTRACT: {
    label: "合同工",
    desc: "项目制合同岗位，期限明确报酬优厚，适合有专项技能的自由职业者",
    icon: "📝",
  },
  INTERNSHIP: {
    label: "实习生",
    desc: "实习岗位，积累经验快速成长，适合在校大学生和应届毕业生",
    icon: "🎓",
  },
  FREELANCE: {
    label: "自由职业",
    desc: "远程自由职业，地点不限按项目结算，适合追求工作生活平衡的人才",
    icon: "🏠",
  },
};

// 城市介绍（复用）
const CITY_INTRO: Record<string, string> = {
  北京: "作为中国政治、文化和科技创新中心，北京拥有全国最密集的互联网与科技企业总部，是高薪职位的核心聚集地。",
  上海: "国际化程度最高的国内城市，金融、电商、游戏及跨境业务发达，适合追求多元职业发展的求职者。",
  深圳: "中国硅谷，以硬件、通信、金融科技闻名，腾讯、华为、大疆等龙头企业带动全链条人才需求。",
  杭州: "依托阿里巴巴等电商巨头，在电商、云计算、直播和SaaS领域独占鳌头，生活成本相对友好。",
  广州: "传统商贸与新兴互联网并重，游戏、社交、跨境电商发展迅速，适合追求工作生活平衡的求职者。",
  成都: "西部互联网重镇，游戏之都，在社交、文娱、企业服务领域表现出色，生活幸福指数高。",
  武汉: "高校云集人才储备丰富，在光电子、人工智能、在线教育领域发展迅速，中部地区最具潜力就业市场。",
  西安: "西北地区科技中心，航空航天、软件开发、军工信息化产业根基深厚，房价较低适合安居乐业。",
  南京: "科教资源丰富，软件与信息服务业发达，拥有良好公共服务和城市环境，适合长期职业发展。",
  苏州: "制造业和工业园区闻名，在生物医药、人工智能、工业互联网新兴领域加速布局。",
};

// 所有可能的城市（从数据库动态获取 + 兜底）
const FALLBACK_CITIES = Object.keys(CITY_INTRO);

function getTypeLabel(type: string): string {
  return JOB_TYPES[type]?.label || type;
}

function generateTypeMetadata(city: string, type: string, locale = "zh"): Metadata {
  const typeLabel = getTypeLabel(type);
  const cityIntro = CITY_INTRO[city] || "";
  const isEn = locale === "en";
  const title = isEn
    ? `${city} ${typeLabel} Jobs - Latest Openings | ${SITE_NAME}`
    : `${city}${typeLabel}招聘 - ${city}最新${typeLabel}职位 | ${SITE_NAME}`;
  const description = isEn
    ? `Browse ${typeLabel} jobs in ${city}. ${cityIntro.slice(0, 80)}Real-time updates.`
    : `查看${city}${typeLabel}招聘信息，${typeLabel}岗位汇总。${cityIntro.slice(0, 80)}实时更新，快速找到${city}的理想${typeLabel}工作。`;
  const url = `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`;

  return {
    title,
    description,
    keywords: isEn
      ? [`${city} ${typeLabel} jobs`, `${city} hiring`, `${city} tech jobs`, `${typeLabel} work`]
      : [
      `${city}${typeLabel}招聘`,
      `${city}${typeLabel}职位`,
      `${city}${typeLabel}求职`,
      `${city}${typeLabel}找工作`,
      `${city}招聘`,
      `${typeLabel}工作`,
      `${city}高薪职位`,
      `${city}互联网招聘`,
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: isEn ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": `${SITE_URL}/zh/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`,
        "en": `${SITE_URL}/en/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`,
        "x-default": `${SITE_URL}/zh/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`,
      },
    },
  };
}

interface PageProps {
  params: Promise<{ city: string; type: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    // 从数据库获取有职位的城市
    const cityData = await prisma.jobs.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
    });
    const cities = cityData.map((c) => c.city).filter(Boolean) as string[];
    const types = Object.keys(JOB_TYPES);

    // 生成城市×类型的组合
    const params: { city: string; type: string }[] = [];
    for (const city of [...new Set([...cities, ...FALLBACK_CITIES])]) {
      for (const type of types) {
        params.push({ city, type });
      }
    }
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: rawCity, type: rawType, locale } = await params;
  const city = decodeURIComponent(rawCity);
  const type = decodeURIComponent(rawType);
  return generateTypeMetadata(city, type, locale);
}

export default async function CityTypeJobsPage({ params }: PageProps) {
  const { city: rawCity, type: rawType, locale } = await params;
  const city = decodeURIComponent(rawCity);
  const type = decodeURIComponent(rawType);

  const typeInfo = JOB_TYPES[type];
  if (!typeInfo) {
    notFound();
  }

  const jobs = await prisma.jobs.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: "" },
      city,
      employmentType: type as Prisma.jobsCreateInput["employmentType"],
    },
    include: {
      companies: true,
    },
    orderBy: { datePosted: "desc" },
    take: 20,
  });

  const jobSchemas = jobs.map((job) => generateJobPostingSchema(job, locale));
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: `${SITE_URL}/${locale}` },
    { name: "职位", url: `${SITE_URL}/${locale}/jobs` },
    { name: `${city}招聘`, url: `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(city)}` },
    { name: `${city}${typeInfo.label}招聘`, url: `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}` },
  ]);

  const isEn = locale === "en";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchemas) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4">
              <Breadcrumb
                items={[
                  { label: "职位列表", href: `/${locale}/jobs` },
                  { label: `${city}招聘`, href: `/${locale}/jobs/city/${encodeURIComponent(city)}` },
                  { label: `${city}${typeInfo.label}招聘` },
                ]}
              />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{typeInfo.icon}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {city}{typeInfo.label}招聘
              </h1>
            </div>
            <p className="text-gray-600 max-w-3xl leading-relaxed">
              {city}最新{typeInfo.label}岗位，{typeInfo.desc}。
              {CITY_INTRO[city] && ` ${CITY_INTRO[city]}`}
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* 同一城市其他职位类型快捷入口 */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {city}其他职位类型
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(JOB_TYPES).map(([key, info]) => (
                <Link
                  key={key}
                  href={`/${locale}/jobs/city/${encodeURIComponent(city)}/${key}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all ${
                    key === type
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  <span>{info.icon}</span>
                  {info.label}
                </Link>
              ))}
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isEn ? `No ${city} ${typeInfo.label} Jobs` : `暂无${city}${typeInfo.label}职位`}
              </h3>
              <p className="text-gray-500 mb-6">
                {isEn ? `No ${typeInfo.label} positions in ${city}. Check other types or all jobs.` : `该城市下暂时没有${typeInfo.label}岗位，看看其他类型或全部职位吧`}
              </p>
              <Link
                href={`/${locale}/jobs/city/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              >
                {isEn ? `View All ${city} Jobs` : `查看${city}全部职位`}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  共{" "}
                  <span className="font-semibold text-gray-900">
                    {jobs.length}
                  </span>{" "}
                  个{city}{typeInfo.label}职位
                </p>
              </div>

              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCardV2 key={job.id} job={job} variant="compact" locale={locale} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href={`/${locale}/jobs?city=${encodeURIComponent(city)}&type=${type}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  查看更多{city}{typeInfo.label}职位
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
