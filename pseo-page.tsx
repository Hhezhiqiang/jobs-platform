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

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "JobQuip";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

const JOB_TYPES: Record<string, { label: string; desc: string; icon: string }> = {
  FULL_TIME: { label: "全职", desc: "稳定全职岗位", icon: "💼" },
  PART_TIME: { label: "兼职", desc: "灵活兼职机会", icon: "⏰" },
  CONTRACT: { label: "合同工", desc: "项目制合同岗位", icon: "📝" },
  INTERNSHIP: { label: "实习生", desc: "实习岗位积累经验", icon: "🎓" },
  FREELANCE: { label: "自由职业", desc: "远程自由职业", icon: "🏠" },
};

const CITY_SLUG_TO_NAME: Record<string, string> = {
  beijing: "北京", shanghai: "上海", shenzhen: "深圳", hangzhou: "杭州",
  guangzhou: "广州", chengdu: "成都", wuhan: "武汉", xian: "西安",
  nanjing: "南京", suzhou: "苏州", remote: "远程", yuan: "远程",
  "": "全国", all: "全国"
};

const CITY_NAME_TO_EN: Record<string, string> = {
  "北京": "Beijing", "上海": "Shanghai", "深圳": "Shenzhen", "杭州": "Hangzhou",
  "广州": "Guangzhou", "成都": "Chengdu", "武汉": "Wuhan", "西安": "Xi'an",
  "南京": "Nanjing", "苏州": "Suzhou", "远程": "Remote", "全国": "All"
};

function getCityName(slug: string, isEn: boolean): string {
  const zh = CITY_SLUG_TO_NAME[slug] || slug;
  if (isEn) return CITY_NAME_TO_EN[zh] || slug;
  return zh;
}

function getTypeLabel(type: string, isEn: boolean): string {
  const zh = JOB_TYPES[type]?.label || type;
  if (isEn) {
    const m: Record<string, string> = {"全职":"Full-Time","兼职":"Part-Time","合同工":"Contract","实习生":"Internship","自由职业":"Freelance"};
    return m[zh] || type;
  }
  return zh;
}

const CITY_INTRO: Record<string, string> = {
  "北京": "作为中国政治、文化和科技创新中心，北京拥有全国最密集的互联网与科技企业总部。",
  "上海": "国际化程度最高的国内城市，金融、电商、游戏及跨境业务发达。",
  "深圳": "中国硅谷，以硬件、通信、金融科技闻名，腾讯、华为、大疆等龙头企业带动人才需求。",
  "杭州": "依托阿里巴巴等电商巨头，在电商、云计算、直播和SaaS领域独占鳌头。",
  "广州": "传统商贸与新兴互联网并重，游戏、社交、跨境电商发展迅速。",
  "成都": "西部互联网重镇，游戏之都，在社交、文娱、企业服务领域表现出色。",
  "武汉": "高校云集人才储备丰富，在光电子、人工智能、在线教育领域发展迅速。",
  "西安": "西北地区科技中心，航空航天、软件开发、军工信息化产业根基深厚。",
  "南京": "科教资源丰富，软件与信息服务业发达，适合长期职业发展。",
  "苏州": "制造业和工业园区闻名，在生物医药、人工智能、工业互联网新兴领域加速布局。",
  "远程": "远程办公职位，不受地域限制，适合追求工作灵活性的求职者。",
};

const FALLBACK_CITIES = Object.keys(CITY_SLUG_TO_NAME);

interface PageProps {
  params: Promise<{ city: string; type: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const cityData = await prisma.jobs.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
    });
    const cities = cityData.map((c) => c.city).filter(Boolean) as string[];
    const types = Object.keys(JOB_TYPES);
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
  const { city, type, locale } = await params;
  const isEn = locale === "en";
  const cityName = getCityName(city, isEn);
  const typeLabel = getTypeLabel(type, isEn);
  const cityIntro = CITY_INTRO[cityName] || CITY_INTRO[city] || "";

  const title = isEn
    ? `${cityName} ${typeLabel} Jobs - Latest Openings | ${SITE_NAME}`
    : `${cityName}${typeLabel}招聘 - ${cityName}最新${typeLabel}职位 | ${SITE_NAME}`;

  const description = isEn
    ? `Browse ${typeLabel} jobs in ${cityName}. ${cityIntro.slice(0, 100)} Real-time updates.`
    : `查看${cityName}${typeLabel}招聘信息，${typeLabel}岗位汇总。${cityIntro.slice(0, 100)}实时更新，快速找到${cityName}的理想${typeLabel}工作。`;

  const url = `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`;

  return {
    title, description,
    keywords: isEn
      ? [`${cityName} ${typeLabel} jobs`, `${cityName} hiring`, `${cityName} tech jobs`]
      : [`${cityName}${typeLabel}招聘`, `${cityName}${typeLabel}职位`, `${cityName}高薪职位`],
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website", locale: isEn ? "en_US" : "zh_CN" },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": `${SITE_URL}/zh/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`,
        "en": `${SITE_URL}/en/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`,
      },
    },
  };
}

export default async function CityTypeJobsPage({ params }: PageProps) {
  const { city, type, locale } = await params;
  const isEn = locale === "en";
  const cityName = getCityName(city, isEn);
  const typeLabel = getTypeLabel(type, isEn);
  const cityIntro = CITY_INTRO[cityName] || CITY_INTRO[city] || "";

  const typeInfo = JOB_TYPES[type];
  if (!typeInfo) notFound();

  const whereClause: any = { status: "ACTIVE" };
  if (city && city !== "all" && city !== "") {
    const zhCity = getCityName(city, false);
    whereClause.OR = [{ city }, { city: zhCity }];
  }

  const jobs = await prisma.jobs.findMany({
    where: whereClause,
    include: { companies: true },
    orderBy: { datePosted: "desc" },
    take: 50,
  });

  const jobSchemas = jobs.map((job) => generateJobPostingSchema(job, locale));
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isEn ? "Home" : "首页", url: `${SITE_URL}/${locale}` },
    { name: isEn ? "Jobs" : "职位", url: `${SITE_URL}/${locale}/jobs` },
    { name: `${cityName} ${typeLabel}`, url: "" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchemas) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: isEn ? "Home" : "首页", href: `/${locale}` },
            { label: isEn ? "Jobs" : "职位", href: `/${locale}/jobs` },
            { label: `${cityName} ${typeLabel}`, href: undefined },
          ]}
          
        />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEn ? `${cityName} ${typeLabel} Jobs` : `${cityName}${typeLabel}招聘`}
          </h1>
          <p className="text-gray-500 mt-2 max-w-3xl">{cityIntro}</p>
        </div>
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500">{isEn ? "No jobs found" : "暂无该类职位"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => <JobCardV2 key={job.id} job={job}  />)}
          </div>
        )}
        <div className="mt-8 text-center text-sm text-gray-400">
          {isEn ? `Found ${jobs.length} ${typeLabel.toLowerCase()} jobs` : `共找到 ${jobs.length} 个${typeLabel}职位`}
        </div>
      </div>
    </div>
  );
}
