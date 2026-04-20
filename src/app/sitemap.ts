import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

// Build-time timestamp — set once per deployment
const BUILD_TIME = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  const zh = `${baseUrl}/zh`;

  // ── 1. 静态页面（核心入口）──
  // 使用 BUILD_TIME 而非 new Date()，避免每次请求时间都变
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${zh}`, priority: 1.0, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${zh}/jobs`, priority: 0.9, changeFrequency: "hourly", lastModified: BUILD_TIME },
    { url: `${zh}/blog`, priority: 0.9, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${zh}/companies`, priority: 0.85, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${zh}/salary-insights`, priority: 0.8, changeFrequency: "weekly", lastModified: BUILD_TIME },
    { url: `${zh}/career-trail`, priority: 0.75, changeFrequency: "weekly", lastModified: BUILD_TIME },
    { url: `${zh}/about`, priority: 0.7, changeFrequency: "monthly", lastModified: BUILD_TIME },
    { url: `${zh}/contact`, priority: 0.6, changeFrequency: "monthly", lastModified: BUILD_TIME },
    { url: `${zh}/faq`, priority: 0.6, changeFrequency: "monthly", lastModified: BUILD_TIME },
    { url: `${zh}/search`, priority: 0.6, changeFrequency: "daily", lastModified: BUILD_TIME },
    // 英文版
    { url: `${baseUrl}/en`, priority: 0.9, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${baseUrl}/en/jobs`, priority: 0.8, changeFrequency: "hourly", lastModified: BUILD_TIME },
    { url: `${baseUrl}/en/blog`, priority: 0.8, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${baseUrl}/en/companies`, priority: 0.75, changeFrequency: "daily", lastModified: BUILD_TIME },
    { url: `${baseUrl}/en/faq`, priority: 0.6, changeFrequency: "monthly", lastModified: BUILD_TIME },
    { url: `${baseUrl}/en/salary-insights`, priority: 0.75, changeFrequency: "weekly", lastModified: BUILD_TIME },
  ];

  // ── 2. 博客文章（内容核心）──
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const isTestSlug = (slug: string) => {
    if (!slug || slug.length < 3) return true;
    if (/\d{10,}/.test(slug)) return true;
    if (/^test[-_]/i.test(slug)) return true;
    if (/^[a-z0-9]$/i.test(slug)) return true;
    if (/^-m[a-z]{5,}$/i.test(slug)) return true;
    return false;
  };

  const blogEntries: MetadataRoute.Sitemap = blogs
    .filter((blog) => !isTestSlug(blog.slug))
    .map((blog) => ({
      url: `${zh}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    }));

  // ── 3. 职位页面（Google for Jobs 核心）──
  const jobs = await prisma.jobs.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${zh}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    priority: 0.7,
    changeFrequency: "daily" as const,
  }));

  // ── 4. 公司页面 ──
  const companies = await prisma.companies.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const companyEntries: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${zh}/companies/${company.slug}`,
    lastModified: company.updatedAt,
    priority: 0.65,
    changeFrequency: "weekly" as const,
  }));

  // ── 5. 城市职位页（本地 SEO）──
  const cities = await prisma.jobs.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", city: { not: null } },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 50,
  });

  const cityEntries: MetadataRoute.Sitemap = cities
    .filter((c) => c.city)
    .map((c) => ({
      url: `${zh}/jobs/city/${encodeURIComponent(c.city!)}`,
      lastModified: BUILD_TIME,
      priority: 0.6,
      changeFrequency: "daily" as const,
    }));

  // ── 6. 职业叙事/面经页 ──
  const stories = await prisma.careerStory.findMany({
    where: {},
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const storyEntries: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${zh}/career-trail/${s.id}`,
    lastModified: s.updatedAt,
    priority: 0.5,
    changeFrequency: "weekly" as const,
  }));

  return [
    ...staticPages,
    ...blogEntries,
    ...jobEntries,
    ...companyEntries,
    ...cityEntries,
    ...storyEntries,
  ];
}
