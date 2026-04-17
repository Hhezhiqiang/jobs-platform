import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/_next/",
          "/private",
          "/auth/",
          "/dashboard/",
          "/company/",
          "/promoter/",
        ],
      },
      // ── 搜索引擎爬虫 ──
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "Sogou web spider",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "Yisouspider",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      // ── AI / LLM 爬虫 ──
      {
        userAgent: "GPTBot", // ChatGPT 爬虫
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "Google-Extended", // Gemini / Google AI
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "CCBot", // Common Crawl
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "anthropic-ai", // Claude 爬虫
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "ClaudeBot", // Claude 爬虫
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "PerplexityBot", // Perplexity 爬虫
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "Omgilibot", // Omgili AI
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "FacebookBot", // Meta AI
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
