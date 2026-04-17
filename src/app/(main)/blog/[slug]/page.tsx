import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BlogDetailClient } from "./blog-detail-client";
import { BlogArticleStructuredData } from "@/components/structured-data";
import { cache } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

const getBlogPost = cache(async (slug: string) => {
  const post = await prisma.pages.findUnique({
    where: { 
      slug,
      type: "BLOG",
      status: "PUBLISHED"
    },
    select: {
      id: true,
      title: true,
      titleEn: true,
      content: true,
      contentEn: true,
      excerpt: true,
      excerptEn: true,
      featuredImage: true,
      keywords: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaTitleEn: true,
      metaDescriptionEn: true,
    },
  });

  return post;
});

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "文章未找到 | JobsBro",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || "",
    keywords: post.keywords,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["JobsBro编辑"],
      images: post.featuredImage ? [post.featuredImage] : [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [`${SITE_URL}/logo.png`],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // 增加浏览量
  await prisma.pages.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  const postForClient = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  return (
    <>
      <BlogArticleStructuredData post={postForClient} />
      <BlogDetailClient post={postForClient} locale="zh" />
    </>
  );
}

// ISR - 每10分钟重新验证
export const revalidate = 600;
