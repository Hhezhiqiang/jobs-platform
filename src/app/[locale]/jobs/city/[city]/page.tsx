import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { JobCardV2 } from "@/components/job-card-v2";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = "https://jobquip.com";

// 动态验证城市：检查数据库中是否有该城市的活跃职位
async function isValidCity(city: string): Promise<boolean> {
  const count = await prisma.jobs.count({
    where: { status: "ACTIVE", city },
  });
  return count > 0;
}

const CITY_INTRO: Record<string, string> = {
  北京:
    "作为中国的政治、文化和科技创新中心，北京拥有全国最密集的互联网与科技企业总部。中关村、望京、后厂村等产业集群汇聚了字节跳动、百度、小米等头部公司，技术岗位需求旺盛，是高薪职位的核心聚集地。",
  上海:
    "上海是国际化程度最高的国内城市，金融、电商、游戏及跨境业务发达。陆家嘴、张江、漕河泾等区域聚集了大量外资企业和本土互联网巨头分部，适合追求多元职业发展的求职者。",
  深圳:
    "深圳被称为『中国硅谷』，以硬件、通信、金融科技和新消费闻名。腾讯、华为、大疆等龙头企业带动了全链条人才需求，创业氛围浓厚，是技术极客和产品创新人才的理想之城。",
  杭州:
    "依托阿里巴巴等电商巨头，杭州在电商、云计算、直播和SaaS领域独占鳌头。城西科创大走廊、未来科技城正在快速崛起，生活成本相对友好，吸引了大量互联网从业者安家落户。",
  广州:
    "广州是传统商贸与新兴互联网并重的大都市，游戏、社交、跨境电商和教育科技发展迅速。天河、琶洲等区域聚集了网易微信、唯品会等知名企业，生活气息浓厚，适合追求工作生活平衡的求职者。",
  成都:
    "成都已成为西部互联网重镇，被誉为『游戏之都』，同时在社交、文娱、企业服务等领域表现出色。高新区和天府软件园聚集了大量科技公司，生活幸福指数高，是越来越多年轻人择业的热门目的地。",
  武汉:
    "武汉高校云集，人才储备丰富，近年来在光电子、人工智能、在线教育等领域发展迅速。光谷步行街及周边科技园吸引了华为武研所、小米武汉总部等大型企业入驻，成为中部地区最具潜力的就业市场。",
  西安:
    "西安是西北地区的科技中心，航空航天、软件开发、军工信息化产业根基深厚。高新区和软件新城聚集了华为、中兴、比亚迪等企业的研发中心，房价较低，是技术人才安居乐业的优质选择。",
  南京:
    "南京历史悠久且科教资源丰富，软件与信息服务业发达。雨花软件谷、江北新区等区域积聚了苏宁易购、趋势科技等企业，同时拥有良好的公共服务和城市环境，适合长期职业发展。",
  苏州:
    "苏州以制造业和工业园区闻名，近年来在生物医药、人工智能、工业互联网等新兴领域加速布局。园区和相城区吸引了大量外资研发中心和国内创新企业，是长三角地区不可忽视的就业高地。",
};

// 获取城市介绍，如果没有预定义则生成默认介绍
function getCityIntro(city: string): string {
  if (CITY_INTRO[city]) {
    return CITY_INTRO[city];
  }
  return `${city}最新招聘信息 - 汇聚互联网、科技、金融等热门行业高薪职位，实时更新，快速找到${city}的理想工作。`;
}

function generateCityMetadata(city: string): Metadata {
  const cityIntro = getCityIntro(city);
  const title = `${city}招聘信息 - ${city}最新高薪职位 | ${SITE_NAME}`;
  const description = `查看${city}最新招聘信息，汇聚互联网、科技、金融等热门行业高薪职位。${cityIntro.slice(0, 120)}实时更新，快速找到${city}的理想工作。`;
  const url = `${SITE_URL}/jobs/city/${encodeURIComponent(city)}`;
  return {
    title,
    description,
    keywords: [
      `${city}招聘`,
      `${city}求职`,
      `${city}找工作`,
      `${city}高薪职位`,
      `${city}互联网招聘`,
      `${city}最新招聘`,
      `${city}人才网`,
      `${city}招聘信息`,
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
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
    },
  };
}

interface PageProps {
  params: Promise<{ city: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const cities = await prisma.jobs.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
    });
    return cities.map((c) => ({ city: c.city! }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  if (!(await isValidCity(city))) {
    return { title: "页面未找到" };
  }
  return generateCityMetadata(city);
}

export default async function CityJobsPage({ params }: PageProps) {
  const { city, locale } = await params;

  if (!(await isValidCity(city))) {
    notFound();
  }

  const jobs = await prisma.jobs.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: "" },
      city,
    },
    include: {
      companies: true,
    },
    orderBy: { datePosted: "desc" },
    take: 20,
  });

  const jobSchemas = jobs.map((job) => generateJobPostingSchema(job));
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: SITE_URL },
    { name: "职位", url: `${SITE_URL}/jobs` },
    { name: `${city}招聘`, url: `${SITE_URL}/jobs/city/${encodeURIComponent(city)}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchemas) }}
      />

      <div className="min-h-screen bg-gray-50">

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4">
              <Breadcrumb
                items={[
                  { label: "职位列表", href: "/jobs" },
                  { label: `${city}招聘` },
                ]}
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {city}招聘信息
            </h1>
            <p className="text-gray-600 max-w-3xl leading-relaxed">
              {getCityIntro(city)}
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* 相关专题快捷入口 */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              热门专题
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                { label: `${city}Java开发`, href: "/topics/java-developer" },
                { label: `${city}前端开发`, href: "/topics/frontend-developer" },
                { label: `${city}产品经理`, href: "/topics/product-manager" },
                { label: `${city}远程工作`, href: "/topics/remote-jobs" },
                { label: `${city}应届生招聘`, href: "/topics/fresh-graduate" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                暂无{city}职位
              </h3>
              <p className="text-gray-500 mb-6">
                该城市下暂时没有符合条件的职位，去看看其他城市或全部职位吧
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              >
                查看更多职位
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
                  个{city}职位
                </p>
              </div>

              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCardV2 key={job.id} job={job} variant="compact" locale={locale} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href={`/jobs?city=${encodeURIComponent(city)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  查看更多{city}职位
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
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
