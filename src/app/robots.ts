import { MetadataRoute } from "next";

// 强制使用生产域名
const SITE_URL = "https://jobs-platform-gold.vercel.app";

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
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
