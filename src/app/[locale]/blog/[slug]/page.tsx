import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { formatSalary, safeJsonLdStringify } from "@/lib/utils";
import { ViewCounter } from "@/components/view-counter";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ArticleReadTracker } from "@/components/game/article-read-tracker";
import type { pages, users } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

type BlogPostWithAuthor = pages & { users: users };

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await prisma.pages.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true },
      take: 500,
    });
    return posts.flatMap((post) => [
      { slug: post.slug, locale: 'zh' as const },
      { slug: post.slug, locale: 'en' as const },
    ]);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    const decodedSlug = decodeURIComponent(slug);
    // 允许预览草稿和已发布的文章
    const post = await prisma.pages.findUnique({
    where: { slug: decodedSlug, type: "BLOG" },
    include: { users: true },
  });

  if (!post) {
    return { title: "文章未找到" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  const postUrl = `${siteUrl}/${locale}/blog/${post.slug}`;
  const isEn = locale === "en";
  const displayTitle = isEn && post.metaTitleEn ? post.metaTitleEn : post.metaTitle || `${post.title} | ${isEn ? "Blog" : "招聘平台博客"}`;
  const displayDesc = isEn && post.metaDescriptionEn ? post.metaDescriptionEn : post.metaDescription || post.excerpt?.slice(0, 160);
  const displayHeadline = isEn && post.titleEn ? post.titleEn : post.title;

  return {
    title: displayTitle,
    description: displayDesc,
    keywords: post.keywords,
    openGraph: {
      title: displayHeadline,
      description: (isEn && post.excerptEn) || post.excerpt || "",
      url: postUrl,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.users?.name || "JobQuip"],
      images: post.featuredImage ? [{ url: post.featuredImage }] : [{ url: `${siteUrl}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: displayHeadline,
      description: (isEn && post.excerptEn) || post.excerpt || "",
      images: post.featuredImage ? [{ url: post.featuredImage }] : [{ url: `${siteUrl}/logo.png` }],
    },
    alternates: {
      canonical: postUrl,
      languages: {
        "zh-CN": `${siteUrl}/zh/blog/${post.slug}`,
        "en": `${siteUrl}/en/blog/${post.slug}`,
        "x-default": `${siteUrl}/zh/blog/${post.slug}`,
      },
    },
  };
  } catch {
    return { title: "文章未找到" };
  }
}

// 生成 Article Schema
function generateArticleSchema(post: BlogPostWithAuthor, locale: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || `${siteUrl}/logo.png`,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.users?.name || "JobQuip",
    },
    publisher: {
      "@type": "Organization",
      name: locale === "en" ? "JobQuip Blog" : "招聘平台",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    url: `${siteUrl}/${locale}/blog/${post.slug}`,
  };
}

// 生成 Breadcrumb Schema
function generateBreadcrumbSchema(slug: string, title: string, locale: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  const isEn = locale === 'en';
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEn ? "Home" : "首页", item: siteUrl },
      { "@type": "ListItem", position: 2, name: isEn ? "Blog" : "博客", item: `${siteUrl}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: title, item: `${siteUrl}/${locale}/blog/${slug}` },
    ],
  };
}

// 生成 FAQ Schema
function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const rawSlug = resolvedParams.slug;
    const locale = resolvedParams.locale || "zh";
    const isEn = locale === "en";
    const slug = decodeURIComponent(rawSlug);
    // 允许预览草稿和已发布的文章
    const post = await prisma.pages.findUnique({
      where: { slug, type: "BLOG" },
      include: { users: true },
    });

    if (!post) {
      notFound();
    }

    // 获取相关职位（基于关键词匹配）+ 最新职位（并行查询）
  const keyword = post.keywords?.[0] || "";
  const [relatedJobs, fallbackJobs] = await Promise.all([
    keyword
      ? prisma.jobs.findMany({
          where: {
            status: "ACTIVE",
            slug: { not: "" },
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } },
            ],
          },
          include: { companies: true },
          take: 3,
        })
      : Promise.resolve([]),
    prisma.jobs.findMany({
      where: {
        status: "ACTIVE",
        slug: { not: "" },
      },
      include: { companies: true },
      orderBy: { datePosted: "desc" },
      take: 3,
    }),
  ]);

  const displayJobs = relatedJobs.length > 0 ? relatedJobs : fallbackJobs;

  // 从文章内容提取 FAQ（支持多种格式）
  const faqs: { question: string; answer: string }[] = [];
  
  // 方式 1: 查找 ## FAQ 或 ## 常见问题 部分
  const faqMatch = post.content.match(/## (FAQ|常见问题)[\s\S]*?(?=##|$)/i);
  if (faqMatch) {
    const faqContent = faqMatch[0];
    const qaMatches = faqContent.matchAll(/\*\*Q[:：]?\s*(.+?)\*\*[\s\S]*?A[:：]?\s*(.+?)(?=\*\*Q[:：]?|$)/gi);
    for (const match of qaMatches) {
      if (match[1] && match[2]) {
        faqs.push({
          question: match[1].trim(),
          answer: match[2].trim().replace(/\n/g, " "),
        });
      }
    }
  }
  
  // 方式 2: 如果文章没有 FAQ，基于标题和关键词生成基础 FAQ
  if (faqs.length === 0) {
    const keywords = post.keywords || [];
    const mainKeyword = keywords[0] || post.title.slice(0, 10);
    faqs.push({
      question: `${post.title} 主要讲了什么？`,
      answer: post.excerpt || (isEn
        ? `${post.titleEn || post.title} is a professional article from JobQuip providing detailed career guidance.`
        : `${post.title}是 JobQuip招聘平台的一篇专业文章，为您提供详细的求职/职业发展指导。`),
    });
    if (keywords.length > 0) {
      faqs.push({
        question: isEn
          ? `What career advice is related to ${mainKeyword}?`
          : `${mainKeyword} 相关的职业发展建议有哪些？`,
        answer: isEn
          ? `This article provides practical career advice around ${keywords.slice(0, 3).join(', ')} and industry insights.`
          : `本文围绕 ${keywords.slice(0, 3).join('、')} 等关键词，为您提供实用的职业发展建议和行业洞察。`,
      });
    }
  }

  const articleSchema = generateArticleSchema(post, locale);
  const breadcrumbSchema = generateBreadcrumbSchema(slug, post.title, locale);
  const faqSchema = faqs.length > 0 ? generateFAQSchema(faqs) : null;

  return (
    <>
      {/* 文章阅读追踪 */}
      <ArticleReadTracker articleId={post.id} />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(faqSchema) }}
        />
      )}

      <div className="min-h-screen bg-[#f8f7fc]">
        {/* Aurora Blog Header */}
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-8">
          <div className="max-w-5xl mx-auto px-4">
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {isEn ? "Back to Blog List" : "返回博客列表"}
            </Link>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Article Content */}
            <div className="lg:col-span-2">
              <article className="aurora-card rounded-2xl overflow-hidden">
                {/* 封面图 */}
                {post.featuredImage && (
                  <div className="relative h-64 md:h-96 w-full">
                    <Image src={post.featuredImage} alt={post.title} fill sizes="100vw" className="object-cover" priority />
                  </div>
                )}

                {/* Aurora top gradient bar */}
                <div className="h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4]" />

                <div className="p-8">
                  {/* 标题 */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {isEn && post.titleEn ? post.titleEn : post.title}
                  </h1>

                  {/* 作者信息 + 浏览量 */}
                  <div className="flex items-center gap-4 text-gray-600 mb-8 pb-8 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-full flex items-center justify-center text-white font-bold">
                        {post.users?.name?.[0] || "A"}
                      </div>
                      <span>{post.users?.name || (isEn ? "Anonymous" : "匿名作者")}</span>
                    </div>
                    <span>·</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      {post.createdAt.toLocaleDateString(isEn ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                    <span>·</span>
                    <ViewCounter slug={slug} initialCount={post.viewCount ?? 0} />
                  </div>

                  {/* 摘要 */}
                  {(isEn ? post.excerptEn : post.excerpt) && (
                    <div className="bg-[#eef2ff] border-l-4 border-[#6366f1] p-4 mb-8 rounded-r-lg">
                      <p className="text-gray-700 italic">{isEn && post.excerptEn ? post.excerptEn : post.excerpt}</p>
                    </div>
                  )}

                  {/* 目录导航 */}
                  <TableOfContents content={isEn && post.contentEn ? post.contentEn : post.content} locale={locale} />

                  {/* 文章内容 */}
                  <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-[#6366f1]">
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => {
                          const text = String(children);
                          const id = text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
                          return <h2 id={`heading-${id}`} className="scroll-mt-24">{children}</h2>;
                        },
                        h3: ({ children }) => {
                          const text = String(children);
                          const id = text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
                          return <h3 id={`heading-${id}`} className="scroll-mt-24">{children}</h3>;
                        },
                      }}
                    >
                      {isEn && post.contentEn ? post.contentEn : post.content}
                    </ReactMarkdown>
                  </div>

                  {/* 关键词标签 */}
                  {post.keywords && post.keywords.length > 0 && (
                    <div className="mt-8 pt-8 border-t">
                      <p className="text-sm text-gray-500 mb-2">{isEn ? "Keywords:" : "关键词："}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.keywords.filter((keyword: string) => keyword && keyword.trim().length >= 2).map((keyword: string) => (
                          <span key={keyword} className="px-3 py-1 bg-[#eef2ff] text-[#4f46e5] rounded-full text-sm font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              {/* Related Jobs */}
              {displayJobs.length > 0 && (
                <div className="aurora-card rounded-2xl p-6 sticky top-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{isEn ? "🔥 Related Jobs" : "🔥 相关职位推荐"}</h2>
                  <div className="space-y-4">
                    {displayJobs.filter(job => job.slug).map((job) => (
                      <Link key={job.id} href={`/${locale}/jobs/${job.slug}`} className="block p-4 border border-gray-100 rounded-xl hover:border-[#6366f1]/30 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{isEn && job.titleEn ? job.titleEn : job.title}</h3>
                            <p className="text-sm text-gray-600">{isEn && job.companies?.nameEn ? job.companies.nameEn : job.companies?.name}</p>
                            <div className="flex gap-2 mt-2 text-sm text-gray-500">
                              <span>{job.city || job.location}</span>
                              <span>·</span>
                              <span className="text-[#6366f1]">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href={`/${locale}/jobs`} className="inline-block w-full px-6 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                      {isEn ? "View More Jobs" : "查看更多职位"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
  } catch {
    notFound();
  }
}
