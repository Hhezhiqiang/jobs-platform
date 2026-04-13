import { MetadataRoute } from "next";

// 强制使用生产域名（可通过环境变量覆盖）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/auth",
          "/auth/*",
          "/_next",
          "/_next/*",
          "/dashboard",
          "/dashboard/*",
          "/company",
          "/company/*",
          "/user",
          "/user/*",
          "/promoter",
          "/promoter/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api", "/dashboard", "/company", "/user", "/promoter"],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/admin", "/api", "/dashboard", "/company", "/user", "/promoter"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
