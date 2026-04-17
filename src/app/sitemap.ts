import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  // ── 1. 静态页面（核心入口）──
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily", lastModified: new Date() },
    { url: `${baseUrl}/jobs`, priority: 0.9, changeFrequency: "hourly", lastModified: new Date() },
    { url: `${baseUrl}/blog`, priority: 0.9, changeFrequency: "daily", lastModified: new Date() },
    { url: `${baseUrl}/companies`, priority: 0.85, changeFrequency: "daily", lastModified: new Date() },
    { url: `${baseUrl}/salary-insights`, priority: 0.8, changeFrequency: "weekly", lastModified: new Date() },
    { url: `${baseUrl}/career-trail`, priority: 0.75, changeFrequency: "weekly", lastModified: new Date() },
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: "monthly", lastModified: new Date() },
    { url: `${baseUrl}/contact`, priority: 0.6, changeFrequency: "monthly", lastModified: new Date() },
    { url: `${baseUrl}/faq`, priority: 0.6, changeFrequency: "monthly", lastModified: new Date() },
  ];

  // ── 2. 博客文章（内容核心，最高优先）──
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  // ── 3. 职位页面（高频更新，Google for Jobs 核心）──
  const jobs = await prisma.jobs.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 500, // 增加到 500 个
  });

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    priority: 0.7,
    changeFrequency: "daily" as const,
  }));

  // ── 4. 公司页面（含职位数量的权威页面）──
  const companies = await prisma.companies.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 200, // 增加到 200 个
  });

  const companyEntries: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${baseUrl}/companies/${company.slug}`,
    lastModified: company.updatedAt,
    priority: 0.65,
    changeFrequency: "weekly" as const,
  }));

  // ── 5. 城市职位页（本地 SEO 核心）──
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
      url: `${baseUrl}/jobs/city/${encodeURIComponent(c.city!)}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "daily" as const,
    }));

  // ── 6. 职业叙事/面经页（长尾流量）──
  const stories = await prisma.careerStory.findMany({
    where: {},
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const storyEntries: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${baseUrl}/career-trail/${s.id}`,
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
