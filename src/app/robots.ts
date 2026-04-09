import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/jobs",
          "/jobs/*",
          "/companies",
          "/companies/*",
          "/about",
          "/contact",
          "/blog",
          "/blog/*",
          "/faq",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/auth",
          "/auth/*",
          "/_next",
          "/_next/*",
          "/*.json",
          "/*.xml",
          "?*sort=",      // 排序参数页面
          "?*page=999",   // 深分页
          "?*filter=",    // 过滤参数
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
        ],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
