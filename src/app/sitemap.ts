import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// 静态 Sitemap（不查询数据库）
export default function sitemap(): MetadataRoute.Sitemap {
  // 基础页面
  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), priority: 0.9 },
    { url: `${SITE_URL}/companies`, lastModified: new Date(), priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), priority: 0.5 },
  ];

  return staticPages;
}
