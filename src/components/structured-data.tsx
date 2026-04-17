"use client";

import { safeJsonLdStringify } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string | null;
  slug: string;
  featuredImage?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: { name: string } | null;
}

interface BlogStructuredDataProps {
  post?: BlogPost;
  posts?: BlogPost[];
  total?: number;
}

/**
 * 生成博客列表页的Structured Data
 */
export function BlogStructuredData({ posts = [], total = 0 }: BlogStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  const itemListElement = posts.map((post, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${baseUrl}/blog/${post.slug}`,
    name: post.title,
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement,
    numberOfItems: total,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(structuredData),
      }}
    />
  );
}

/**
 * 生成博客详情页的Article Structured Data
 */
export function BlogArticleStructuredData({ post }: { post: BlogPost }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.featuredImage || `${baseUrl}/logo.png`,
    datePublished: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
    dateModified: typeof post.updatedAt === 'string' ? post.updatedAt : post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: post.author?.name || "JobQuip编辑",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "JobQuip招聘平台",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(structuredData),
      }}
    />
  );
}

/**
 * 生成FAQ页面的Structured Data
 */
export function FAQStructuredData({ 
  questions 
}: { 
  questions: Array<{ question: string; answer: string }> 
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(structuredData),
      }}
    />
  );
}

/**
 * 生成HowTo页面的Structured Data
 */
export function HowToStructuredData({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
  totalTime?: string;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(structuredData),
      }}
    />
  );
}

/**
 * 生成BreadcrumbList Structured Data
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(structuredData),
      }}
    />
  );
}
