import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";
  
  const [jobs, companies, blogs, cmsPages] = await Promise.all([
    prisma.job.findMany({
      where: { status: "ACTIVE", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.company.findMany({
      where: { slug: { not: "" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { type: "PAGE", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes = [
    { url: "", priority: 1.0, changefreq: "daily" },
    { url: "/jobs", priority: 0.9, changefreq: "daily" },
    { url: "/companies", priority: 0.8, changefreq: "weekly" },
    { url: "/blog", priority: 0.8, changefreq: "daily" },
    { url: "/about", priority: 0.5, changefreq: "monthly" },
    { url: "/contact", priority: 0.5, changefreq: "monthly" },
    { url: "/faq", priority: 0.5, changefreq: "monthly" },
    { url: "/salary-insights", priority: 0.8, changefreq: "weekly" },
    { url: "/privacy", priority: 0.3, changefreq: "monthly" },
    { url: "/terms", priority: 0.3, changefreq: "monthly" },
    { url: "/auth/login", priority: 0.3, changefreq: "never" },
    { url: "/auth/register", priority: 0.3, changefreq: "never" },
    // 专题页
    { url: "/topics/java-developer", priority: 0.8, changefreq: "daily" },
    { url: "/topics/frontend-developer", priority: 0.8, changefreq: "daily" },
    { url: "/topics/product-manager", priority: 0.8, changefreq: "daily" },
    { url: "/topics/remote-jobs", priority: 0.8, changefreq: "daily" },
    { url: "/topics/fresh-graduate", priority: 0.8, changefreq: "daily" },
    // 城市聚合页
    { url: "/jobs/city/北京", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/上海", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/深圳", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/杭州", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/广州", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/成都", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/武汉", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/西安", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/南京", priority: 0.8, changefreq: "daily" },
    { url: "/jobs/city/苏州", priority: 0.8, changefreq: "daily" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
  ${jobs.map(job => `
  <url>
    <loc>${baseUrl}/jobs/${job.slug}</loc>
    <lastmod>${job.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${companies.map(company => `
  <url>
    <loc>${baseUrl}/companies/${company.slug}</loc>
    <lastmod>${company.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${blogs.map(blog => `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${blog.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${cmsPages.map(page => `
  <url>
    <loc>${baseUrl}/topics/${page.slug}</loc>
    <lastmod>${page.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
