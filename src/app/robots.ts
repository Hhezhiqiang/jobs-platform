import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  return {
    rules: [
      // ── 默认规则 ──
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
        userAgent: "Googlebot-News",
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
      {
        userAgent: "360Spider",
        allow: "/",
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
      },
      {
        userAgent: "YandexBot",
        allow: "/",
      },
      // ── AI / LLM 爬虫 (让 ChatGPT, Claude, Gemini, Perplexity 索引你) ──
      {
        userAgent: "GPTBot", // ChatGPT 爬虫
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "Google-Extended", // Gemini / Google AI
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "CCBot", // Common Crawl (Perplexity/Anthropic)
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "anthropic-ai", // Claude 爬虫
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "ClaudeBot", // Claude 爬虫
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "Claude-Web", // Claude 网页索引
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
        disallow: ["/admin", "/api/", "/dashboard", "/company/"],
      },
      {
        userAgent: "PerplexityBot", // Perplexity AI
        allow: ["/jobs/", "/blog/", "/companies/", "/salary-insights/"],
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
      {
        userAgent: "Applebot", // Apple/Siri AI
        allow: ["/jobs/", "/blog/", "/companies/"],
      },
      {
        userAgent: "cohere-ai", // Cohere AI
        allow: ["/jobs/", "/blog/", "/companies/"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Timpibot", // Timp AI
        allow: ["/jobs/", "/blog/", "/companies/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
