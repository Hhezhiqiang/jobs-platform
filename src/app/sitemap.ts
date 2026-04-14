import { prisma } from "./src/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

  // 1. 静态页面
  const staticPages = [
    { url: baseUrl, priority: 1.0, changefreq: "daily" },
    { url: `${baseUrl}/jobs`, priority: 0.9, changefreq: "hourly" },
    { url: `${baseUrl}/blog`, priority: 0.9, changefreq: "daily" },
    { url: `${baseUrl}/companies`, priority: 0.8, changefreq: "daily" },
    { url: `${baseUrl}/about`, priority: 0.7, changefreq: "weekly" },
  ];

  // 2. 博客文章
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const blogEntries = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    priority: 0.8,
    changefreq: "weekly" as const,
  }));

  // 3. 职位页面
  const jobs = await prisma.jobs.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100, // 只包含最新的100个职位
  });

  const jobEntries = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    priority: 0.7,
    changefreq: "daily" as const,
  }));

  // 4. 公司页面
  const companies = await prisma.companies.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const companyEntries = companies.map((company) => ({
    url: `${baseUrl}/companies/${company.slug}`,
    lastModified: company.updatedAt,
    priority: 0.6,
    changefreq: "weekly" as const,
  }));

  return [...staticPages, ...blogEntries, ...jobEntries, ...companyEntries];
}
