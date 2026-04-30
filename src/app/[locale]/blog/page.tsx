import type { pages, users } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { BookOpen, Clock, Search, Sparkles } from "lucide-react";
import { safeJsonLdStringify } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { AuroraBlogPage } from "@/components/aurora/blog-page";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const zh = `${SITE_URL}/${locale}`;

  return {
    title: isEn
      ? "Career Blog - Salary Reports, Interview Tips & Industry Trends"
      : "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展",
    description: isEn
      ? "Professional career blog with latest salary reports, interview guides, resume tips, and career development advice for tech and Web3 professionals."
      : "专业的互联网求职博客，提供2026最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。",
    keywords: isEn
      ? ["career blog", "salary report", "interview tips", "resume optimization", "career development"]
      : ["求职博客", "薪资报告", "面试攻略", "简历优化", "职业规划"],
    openGraph: {
      title: isEn ? "Career Blog - Salary Reports, Interview Tips & Industry Trends" : "求职博客 - 薪资报告、面试攻略、行业趋势与职业发展",
      description: isEn ? "Professional career blog with salary reports, interview guides, resume tips, and career development advice." : "专业的互联网求职博客，提供薪资报告、面试攻略、简历优化技巧、职业规划指南。",
      url: `${zh}/blog`,
      siteName: "JobQuip",
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: { card: "summary_large_image", title: isEn ? "Career Blog" : "求职博客", description: isEn ? "Professional career blog" : "专业的互联网求职博客", images: [`${SITE_URL}/logo.png`] },
    alternates: { canonical: `${zh}/blog`, languages: { "zh-CN": `${SITE_URL}/zh/blog`, "en": `${SITE_URL}/en/blog`, "x-default": `${SITE_URL}/zh/blog` } },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 3600;

// 博客分类
const CATEGORY_KEYS = [
  { icon: "📚", nameKey: "all" },
  { icon: "🎯", nameKey: "interview" },
  { icon: "📝", nameKey: "resume" },
  { icon: "💰", nameKey: "salary" },
  { icon: "🚀", nameKey: "career" },
  { icon: "📊", nameKey: "trends" },
  { icon: "💡", nameKey: "skills" },
];

// 构建分类查询条件
function buildCategoryWhere(category: string | undefined): string[] | undefined {
  if (!category || category === 'all') return undefined;
  const catToKeywords: Record<string, string[]> = {
    'interview': ['面试', 'interview'],
    'resume': ['简历', 'resume'],
    'salary': ['薪资', 'salary', '涨薪', '谈薪'],
    'career': ['职业', 'career', '升职', '转型'],
    'trends': ['行业', '趋势', 'trends', '现状'],
    'skills': ['技能', 'skills', '职场', '社交'],
  };
  return catToKeywords[category] || [category];
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; keyword?: string; page?: string }>;
}

type PostWithAuthor = pages & { users: users | null };

export default async function BlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "blog" });

  const page = parseInt(sp.page || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  let posts: PostWithAuthor[] = [];
  let total = 0;

  try {
    const where: any = { type: "BLOG", status: "PUBLISHED" };
    if (sp.q) {
      where.OR = [
        { title: { contains: sp.q, mode: "insensitive" } },
        { titleEn: { contains: sp.q, mode: "insensitive" } },
        { excerpt: { contains: sp.q, mode: "insensitive" } },
        { content: { contains: sp.q, mode: "insensitive" } },
      ];
    }
    const categoryKeywords = buildCategoryWhere(sp.category);
    if (categoryKeywords) {
      where.keywords = { hasSome: categoryKeywords };
    }
    
    // 支持关键词筛选
    if (sp.keyword) {
      where.keywords = { has: sp.keyword };
    }

    const [postsData, totalData] = await Promise.all([
      prisma.pages.findMany({ where, include: { users: true }, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.pages.count({ where }),
    ]);
    posts = postsData;
    total = totalData;
  } catch {}

  const totalPages = Math.ceil(total / limit);

  // 构建分类数据
  const categories = CATEGORY_KEYS.map(cat => ({
    icon: cat.icon,
    name: t(`categories.${cat.nameKey}`),
    key: cat.nameKey,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify({ "@context": "https://schema.org", "@type": "Blog", name: locale === "en" ? "JobQuip Career Blog" : "JobQuip求职博客", description: locale === "en" ? "Professional career blog" : "专业的互联网求职博客", url: `${SITE_URL}/${locale}/blog`, publisher: { "@type": "Organization", name: "JobQuip", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } } }) }} />
      <AuroraBlogPage
        initialPosts={posts as any}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        categories={categories}
        currentCategory={sp.category || "all"}
        locale={locale}
      />
    </>
  );
}
