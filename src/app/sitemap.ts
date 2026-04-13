import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, blogs, cmsPages] = await Promise.all([
    prisma.job.findMany({
      where: { status: "ACTIVE", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.company.findMany({
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.page.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.page.findMany({
      where: { type: "PAGE", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/companies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/topics`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/jobs/city`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/salary-insights`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    // 专题页
    { url: `${SITE_URL}/topics/java-developer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/topics/frontend-developer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/topics/product-manager`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/topics/remote-jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/topics/fresh-graduate`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    // 城市聚合页
    ...["北京", "上海", "深圳", "杭州", "广州", "成都", "武汉", "西安", "南京", "苏州"].map((city) => ({
      url: `${SITE_URL}/jobs/city/${encodeURIComponent(city)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...staticRoutes,
    ...jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...companies.map((company) => ({
      url: `${SITE_URL}/companies/${company.slug}`,
      lastModified: company.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...blogs.map((blog) => ({
      url: `${SITE_URL}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...cmsPages.map((page) => ({
      url: `${SITE_URL}/topics/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
