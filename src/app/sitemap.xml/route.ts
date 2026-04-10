import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = "https://jobs-platform-gold.vercel.app";
  
  const [jobs, companies, blogs] = await Promise.all([
    prisma.job.findMany({
      where: { status: "ACTIVE", slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.company.findMany({
      where: { slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: null } },
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
    { url: "/auth/login", priority: 0.3, changefreq: "never" },
    { url: "/auth/register", priority: 0.3, changefreq: "never" },
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
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
