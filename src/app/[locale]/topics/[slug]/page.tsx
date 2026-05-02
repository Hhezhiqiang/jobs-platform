import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { JobCardV2 } from "@/components/job-card-v2";
import { ViewCounter } from "@/components/view-counter";
import { generateJobPostingSchema, generateBreadcrumbSchema } from "@/lib/schema";
import { Prisma } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import { safeJsonLdStringify } from "@/lib/utils";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = "https://jobquip.com";

const VALID_SLUGS = [
  "java-developer",
  "frontend-developer",
  "product-manager",
  "remote-jobs",
  "fresh-graduate",
];

const TOPIC_META: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string[];
    intro: string;
  }
> = {
  "java-developer": {
    title: `Java开发工程师招聘 - 高薪后端职位 | ${SITE_NAME}`,
    description:
      "汇聚全国最新Java开发工程师招聘信息，涵盖互联网、金融科技、电商等行业。高薪后端岗位实时更新，助你快速找到理想的Java开发工作。",
    keywords: [
      "Java开发",
      "Java工程师",
      "后端开发",
      "Java招聘",
      "后端工程师",
      "Java职位",
      "高薪Java",
    ],
    intro:
      "Java开发工程师是企业技术团队的核心力量，市场需求持续旺盛。这里汇聚了各行业最新的Java后端开发岗位，涵盖Spring生态、微服务架构、高并发系统设计等方向，无论你是初级开发者还是资深架构师，都能找到匹配的职业机会。",
  },
  "frontend-developer": {
    title: `前端开发工程师招聘 - React/Vue岗位 | ${SITE_NAME}`,
    description:
      "精选前端开发工程师招聘信息，覆盖React、Vue等主流技术栈。网页、小程序、跨平台开发岗位齐聚，海量高薪前端职位等你来投。",
    keywords: [
      "前端开发",
      "前端工程师",
      "React",
      "Vue",
      "前端招聘",
      "H5开发",
      "小程序开发",
    ],
    intro:
      "前端开发是连接用户与产品的关键桥梁，React、Vue等主流框架的熟练运用是市场上的核心竞争力。本专题汇集了来自互联网、电商、企业服务等领域的高薪前端岗位，涵盖Web、移动端及跨平台开发方向。",
  },
  "product-manager": {
    title: `产品经理招聘 - 互联网PM职位 | ${SITE_NAME}`,
    description:
      "汇集互联网、科技行业产品经理招聘信息，覆盖C端/B端产品、增长产品、策略产品等方向。优质PM岗位实时更新，助你找到心仪的产品工作。",
    keywords: [
      "产品经理",
      "PM",
      "产品招聘",
      "互联网产品",
      "B端产品",
      "C端产品",
      "产品总监",
    ],
    intro:
      "产品经理是推动产品创新与业务增长的核心角色。本专题聚合了互联网、金融科技、企业服务等行业的产品经理招聘信息，覆盖从初级产品专员到高级产品总监的各个层级，帮助你发现下一个职业跳板。",
  },
  "remote-jobs": {
    title: `远程工作招聘 - 居家办公职位 | ${SITE_NAME}`,
    description:
      "精选可远程办公的高薪职位，覆盖技术开发、产品设计、运营等岗位。打破地域限制，在家也能找到理想的全职或兼职工作机会。",
    keywords: [
      "远程工作",
      "居家办公",
      "远程招聘",
      "Remote",
      "在家办公",
      "分布式团队",
      "远程职位",
    ],
    intro:
      "远程工作正在成为职场新趋势，越来越多的企业拥抱分布式团队，为员工提供灵活的工作方式。本专题精选支持远程办公的优质职位，覆盖技术开发、产品设计、运营等多个领域，让你打破地域限制，自由选择工作地点。",
  },
  "fresh-graduate": {
    title: `应届生招聘 - 校招/入职门槛低职位 | ${SITE_NAME}`,
    description:
      "为应届毕业生和职场新人打造的求职专区，汇集校招、应届岗位及入门级职位。无需丰富经验，快速开启职业生涯第一步。",
    keywords: [
      "应届生招聘",
      "校招",
      "应届毕业生",
      "实习转正",
      "入门职位",
      "零经验",
      "校园招聘",
    ],
    intro:
      "应届生和职场新人需要的是一个展示潜力的舞台。本专题汇集了面向应届毕业生的校招岗位、实习转正机会以及接受零经验的入门级职位，涵盖互联网、科技、金融等热门行业，助力你顺利迈出职业生涯第一步。",
  },
};

function buildWhere(slug: string): Prisma.jobsWhereInput {
  const base: Prisma.jobsWhereInput = {
    status: "ACTIVE",
    slug: { not: "" },
  };

  switch (slug) {
    case "java-developer":
      base.title = { contains: "Java", mode: "insensitive" };
      break;
    case "frontend-developer":
      base.OR = [
        { title: { contains: "前端", mode: "insensitive" } },
        { title: { contains: "React", mode: "insensitive" } },
        { title: { contains: "Vue", mode: "insensitive" } },
      ];
      break;
    case "product-manager":
      base.OR = [
        { title: { contains: "产品", mode: "insensitive" } },
        { title: { contains: "PM", mode: "insensitive" } },
      ];
      break;
    case "remote-jobs":
      base.isRemote = true;
      break;
    case "fresh-graduate":
      base.OR = [
        { title: { contains: "应届", mode: "insensitive" } },
        { title: { contains: "校招", mode: "insensitive" } },
        { experience: "ENTRY" },
      ];
      break;
  }

  return base;
}

function generateTopicBreadcrumbSchema(slug: string, title: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "专题", item: `${SITE_URL}/topics` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}/topics/${slug}` },
    ],
  };
}

// 生成 Article Schema（用于 CMS 专题页）
function generateArticleSchema(post: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.users?.name || "招聘平台",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    url: `${SITE_URL}/topics/${post.slug}`,
  };
}

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const cmsSlugs = await prisma.pages.findMany({
      where: { type: "PAGE", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true },
      take: 500,
    });
    const hardcoded = VALID_SLUGS.map((slug) => ({ slug }));
    return [...hardcoded, ...cmsSlugs.map((s) => ({ slug: s.slug }))];
  } catch {
    return VALID_SLUGS.map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

  try {
  const { slug, locale } = await params;
  const currentLocale = locale || "zh";
  const isEn = currentLocale === "en";

  // 1. 尝试 CMS 专题页
  const cmsPage = await prisma.pages.findUnique({
    where: { slug, type: "PAGE", status: "PUBLISHED" },
    select: { title: true, metaDescription: true, metaTitle: true, keywords: true },
  });

  if (cmsPage) {
    const url = `${SITE_URL}/${currentLocale}/topics/${slug}`;
    return {
      title: cmsPage.metaTitle || `${cmsPage.title} | ${SITE_NAME}`,
      description: cmsPage.metaDescription || cmsPage.title,
      keywords: cmsPage.keywords,
      openGraph: { title: cmsPage.title, description: cmsPage.metaDescription || "", url, siteName: SITE_NAME, type: "article", locale: isEn ? "en_US" : "zh_CN" },
      twitter: { card: "summary_large_image", title: cmsPage.title, description: cmsPage.metaDescription || "" },
      alternates: {
        canonical: url,
        languages: {
          "zh-CN": `${SITE_URL}/zh/topics/${slug}`,
          "en": `${SITE_URL}/en/topics/${slug}`,
          "x-default": `${SITE_URL}/zh/topics/${slug}`,
        },
      },
    };
  }

  // 2. Fallback 硬编码专题
  if (!VALID_SLUGS.includes(slug)) {
    return { title: "页面未找到" };
  }
  const meta = TOPIC_META[slug];
  const url = `${SITE_URL}/${currentLocale}/topics/${slug}`;
  // For English, prepend English title prefix
  const title = isEn ? `${meta.title.split(" - ")[0]} Jobs - ${SITE_NAME}` : meta.title;
  const description = isEn ? `Browse ${meta.title.split(" - ")[0]} positions. ${meta.intro.slice(0, 120)}` : meta.description;
  return {
    title,
    description,
    keywords: meta.keywords,
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website", locale: isEn ? "en_US" : "zh_CN" },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": `${SITE_URL}/zh/topics/${slug}`,
        "en": `${SITE_URL}/en/topics/${slug}`,
        "x-default": `${SITE_URL}/zh/topics/${slug}`,
      },
    },
  };

  } catch {
    return { title: "页面未找到" };
  }
}

export default async function TopicPage({ params }: PageProps) {
  try {
    const { slug, locale } = await params;

    // 1. 优先查找 CMS 专题页（由自动发布系统生成）
    const cmsPage = await prisma.pages.findUnique({
    where: { slug, type: "PAGE", status: "PUBLISHED" },
    include: { users: true },
  });

  if (cmsPage) {
    const articleSchema = generateArticleSchema(cmsPage);
    const breadcrumbSchema = generateTopicBreadcrumbSchema(slug, cmsPage.title);

    // 获取相关职位
    const keyword = cmsPage.keywords?.[0] || "";
    const relatedJobs = await prisma.jobs.findMany({
      where: {
        status: "ACTIVE",
        slug: { not: "" },
        OR: keyword
          ? [
              { title: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: { companies: true },
      take: 6,
    });

    const displayJobs = relatedJobs.length > 0 ? relatedJobs : [];

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(articleSchema) }} />

        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <Link href="/topics" className="text-blue-600 hover:text-blue-800">← 返回专题列表</Link>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <article className="bg-white rounded-lg shadow-md overflow-hidden">
              {cmsPage.featuredImage && (
                <div className="relative h-64 md:h-96 w-full">
                  <Image src={cmsPage.featuredImage} alt={cmsPage.title} fill sizes="100vw" className="object-cover" priority />
                </div>
              )}
              <div className="p-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cmsPage.title}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-8 pb-8 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {cmsPage.users?.name?.[0] || "A"}
                    </div>
                    <span>{cmsPage.users?.name || "匿名作者"}</span>
                  </div>
                  <span>·</span>
                  <time dateTime={cmsPage.createdAt.toISOString()}>
                    {cmsPage.createdAt.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                  <span>·</span>
                  <ViewCounter slug={slug} initialCount={cmsPage.viewCount} />
                </div>

                {cmsPage.excerpt && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
                    <p className="text-gray-700 italic">{cmsPage.excerpt}</p>
                  </div>
                )}

                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600">
                  <ReactMarkdown>{cmsPage.content}</ReactMarkdown>
                </div>

                {cmsPage.keywords && cmsPage.keywords.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <p className="text-sm text-gray-500 mb-2">关键词：</p>
                    <div className="flex flex-wrap gap-2">
                      {cmsPage.keywords.map((k: string) => (
                        <span key={k} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {displayJobs.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">相关职位推荐</h2>
                <div className="space-y-4">
                  {displayJobs.map((job) => (
                    <JobCardV2 key={job.id} job={job} variant="compact" locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // 2. Fallback 硬编码专题
  if (!VALID_SLUGS.includes(slug)) {
    notFound();
  }

  const meta = TOPIC_META[slug];

  const jobs = await prisma.jobs.findMany({
    where: buildWhere(slug),
    include: { companies: true },
    orderBy: { datePosted: "desc" },
    take: 20,
  });

  const jobSchemas = jobs.map((job) => generateJobPostingSchema(job));
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "首页", url: SITE_URL },
    { name: "职位", url: `${SITE_URL}/jobs` },
    { name: meta.title.split(" - ")[0], url: `${SITE_URL}/topics/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jobSchemas) }} />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4">
              <Breadcrumb items={[{ label: "职位列表", href: "/jobs" }, { label: meta.title.split(" - ")[0] }]} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{meta.title.split(" - ")[0]}</h1>
            <p className="text-gray-600 max-w-3xl leading-relaxed">{meta.intro}</p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">暂无相关职位</h3>
              <p className="text-gray-500 mb-6">该专题下暂时没有符合条件的职位，去看看其他机会吧</p>
              <Link href="/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                查看更多职位
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  共 <span className="font-semibold text-gray-900">{jobs.length}</span> 个精选职位
                </p>
              </div>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCardV2 key={job.id} job={job} variant="compact" locale={locale} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link href="/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">
                  查看更多职位
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
  } catch {
    notFound();
  }
}
