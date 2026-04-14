import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { formatSalary, safeJsonLdStringify } from "@/lib/utils";
import { ViewCounter } from "@/components/view-counter";
import { TableOfContents } from "@/components/blog/table-of-contents";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await prisma.pages.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true },
      take: 500,
    });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
  const post = await prisma.pages.findUnique({
    where: { slug, type: "BLOG", status: "PUBLISHED" },
    include: { users: true },
  });

  if (!post) {
    return { title: "文章未找到" };
  }

  const siteUrl = "https://jobs-platform-gold.vercel.app";
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: post.metaTitle || `${post.title} | 招聘平台博客`,
    description: post.metaDescription || post.excerpt?.slice(0, 160),
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      url: postUrl,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.users.name],
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: postUrl,
    },
  };
  } catch {
    return { title: "文章未找到" };
  }
}

// 生成 Article Schema
function generateArticleSchema(post: any) {
  const siteUrl = "https://jobs-platform-gold.vercel.app";
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
      name: post.users.name,
    },
    publisher: {
      "@type": "Organization",
      name: "招聘平台",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    url: `${siteUrl}/blog/${post.slug}`,
  };
}

// 生成 Breadcrumb Schema
function generateBreadcrumbSchema(slug: string, title: string) {
  const siteUrl = "https://jobs-platform-gold.vercel.app";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "博客", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: title, item: `${siteUrl}/blog/${slug}` },
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
    const { slug } = await params;
    const post = await prisma.pages.findUnique({
      where: { slug, type: "BLOG", status: "PUBLISHED" },
      include: { users: true },
    });

    if (!post) {
      notFound();
    }

    // 获取相关职位（基于关键词匹配）
  const keyword = post.keywords?.[0] || "";
  const relatedJobs = keyword ? await prisma.jobs.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: "" }, // 确保有 slug
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ],
    },
    include: { companies: true },
    take: 3,
  }) : [];

  // 如果没有匹配到，获取最新职位
  const fallbackJobs = relatedJobs.length === 0 
    ? await prisma.jobs.findMany({
        where: { 
          status: "ACTIVE",
          slug: { not: "" }, // 确保有 slug
        },
        include: { companies: true },
        orderBy: { datePosted: "desc" },
        take: 3,
      })
    : [];

  const displayJobs = relatedJobs.length > 0 ? relatedJobs : fallbackJobs;

  // 从文章内容提取 FAQ（简化版：查找 ## FAQ 或 ## 常见问题 部分）
  const faqMatch = post.content.match(/## (FAQ|常见问题)[\\s\\S]*?(?=##|$)/i);
  const faqs: { question: string; answer: string }[] = [];
  
  if (faqMatch) {
    const faqContent = faqMatch[0];
    const qaMatches = faqContent.matchAll(/\\*\\*Q[:：]?\\s*(.+?)\\*\\*[\\s\\S]*?A[:：]?\\s*(.+?)(?=\\*\\*Q[:：]?|$)/gi);
    for (const match of qaMatches) {
      if (match[1] && match[2]) {
        faqs.push({
          question: match[1].trim(),
          answer: match[2].trim().replace(/\\n/g, " "),
        });
      }
    }
  }

  const articleSchema = generateArticleSchema(post);
  const breadcrumbSchema = generateBreadcrumbSchema(slug, post.title);
  const faqSchema = faqs.length > 0 ? generateFAQSchema(faqs) : null;

  return (
    <>
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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/blog" className="text-blue-600 hover:text-blue-800">
                ← 返回博客列表
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 封面图 */}
            {post.featuredImage && (
              <div className="relative h-64 md:h-96 w-full">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="p-8">
              {/* 标题 */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* 作者信息 + 浏览量 */}
              <div className="flex items-center gap-4 text-gray-600 mb-8 pb-8 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {post.users?.name?.[0] || "A"}
                  </div>
                  <span>{post.users?.name || "匿名作者"}</span>
                </div>
                <span>·</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {post.createdAt.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>·</span>
                <ViewCounter slug={slug} initialCount={post.viewCount} />
              </div>

              {/* 摘要 */}
              {post.excerpt && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
                  <p className="text-gray-700 italic">{post.excerpt}</p>
                </div>
              )}

              {/* 目录导航 */}
              <TableOfContents content={post.content} />

              {/* 文章内容 */}
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600">
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
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* 关键词标签 */}
              {post.keywords && post.keywords.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <p className="text-sm text-gray-500 mb-2">关键词：</p>
                  <div className="flex flex-wrap gap-2">
                    {post.keywords.map((keyword: string) => (
                      <span
                        key={keyword}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* 相关职位推荐 */}
          {displayJobs.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 相关职位推荐</h2>
              <div className="space-y-4">
                {displayJobs.filter(job => job.slug).map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.slug}`}
                    className="block p-4 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.companies?.name}</p>
                        <div className="flex gap-2 mt-2 text-sm text-gray-500">
                          <span>{job.location}</span>
                          <span>·</span>
                          <span className="text-blue-600">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>
                      </div>
                      <span className="text-blue-600 text-sm">查看详情 →</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/jobs"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看更多职位
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
  } catch {
    notFound();
  }
}
