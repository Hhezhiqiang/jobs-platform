import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.page.findUnique({
    where: { slug, type: "BLOG", status: "PUBLISHED" },
    include: { author: true },
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
      authors: [post.author.name],
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
      name: post.author.name,
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

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.page.findUnique({
    where: { slug, type: "BLOG", status: "PUBLISHED" },
    include: { author: true },
  });

  if (!post) {
    notFound();
  }

  const articleSchema = generateArticleSchema(post);
  const breadcrumbSchema = generateBreadcrumbSchema(slug, post.title);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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

              {/* 作者信息 */}
              <div className="flex items-center gap-4 text-gray-600 mb-8 pb-8 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {post.author.name[0]}
                  </div>
                  <span>{post.author.name}</span>
                </div>
                <span>·</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {post.createdAt.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>

              {/* 摘要 */}
              {post.excerpt && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
                  <p className="text-gray-700 italic">{post.excerpt}</p>
                </div>
              )}

              {/* 文章内容 */}
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600">
                <ReactMarkdown>{post.content}</ReactMarkdown>
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
        </main>
      </div>
    </>
  );
}
