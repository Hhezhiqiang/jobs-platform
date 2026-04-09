import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// 每页最大条目数
const SITEMAP_SIZE = 50000;

export async function generateSitemaps(): Promise<MetadataRoute.Sitemap> {
  // 基础页面
  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), priority: 0.9 },
    { url: `${SITE_URL}/companies`, lastModified: new Date(), priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), priority: 0.5 },
  ];

  // 获取所有活跃的职位
  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const jobPages = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    priority: 0.8,
  }));

  // 获取所有公司
  const companies = await prisma.company.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const companyPages = companies.map((company) => ({
    url: `${SITE_URL}/companies/${company.slug}`,
    lastModified: company.updatedAt,
    priority: 0.6,
  }));

  return [...staticPages, ...jobPages, ...companyPages];
}

// 主 sitemap 导出
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemaps();
}
