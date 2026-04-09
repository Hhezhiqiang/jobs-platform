import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 强制使用生产域名
  const SITE_URL = "https://jobs-platform-gold.vercel.app";

  // 静态页面
  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), priority: 0.9 },
    { url: `${SITE_URL}/companies`, lastModified: new Date(), priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), priority: 0.5 },
  ];

  // 动态职位页面
  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });

  const jobPages = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    priority: 0.8,
  }));

  // 动态公司页面
  const companies = await prisma.company.findMany({
    select: { slug: true, updatedAt: true },
  });

  const companyPages = companies.map((company) => ({
    url: `${SITE_URL}/companies/${company.slug}`,
    lastModified: company.updatedAt,
    priority: 0.7,
  }));

  return [...staticPages, ...jobPages, ...companyPages];
}
