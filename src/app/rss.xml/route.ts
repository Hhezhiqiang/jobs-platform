import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  // Detect language from URL or Accept-Language header
  const url = new URL(request.url);
  const locale = url.pathname.includes("/en/") ? "en" : "zh";

  // 获取最新博客（增加到 50）
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      title: true,
      titleEn: true,
      slug: true,
      excerpt: true,
      excerptEn: true,
      content: true,
      contentEn: true,
      createdAt: true,
    },
  });

  const rss = generateRss(blogs, baseUrl, locale);

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function generateRss(
  blogs: Array<{
    title: string;
    titleEn?: string | null;
    slug: string;
    excerpt?: string | null;
    excerptEn?: string | null;
    content: string;
    contentEn?: string | null;
    createdAt: Date;
  }>,
  baseUrl: string,
  locale: string
) {
  const isEn = locale === "en";
  const localePrefix = isEn ? "/en" : "";

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${isEn ? "JobQuip Career Blog - Industry Insights & Tips" : "JobQuip招聘平台 - 求职博客"}</title>
    <link>${baseUrl}${localePrefix}/blog</link>
    <description>${isEn ? "Professional career blog with salary reports, interview guides, industry trends and career development advice for tech and Web3 professionals." : "专业的互联网求职博客，提供最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。"}</description>
    <language>${isEn ? "en-US" : "zh-CN"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}${localePrefix}/rss.xml" rel="self" type="application/rss+xml"/>
    ${blogs.map(blog => {
      const title = isEn && blog.titleEn ? blog.titleEn : blog.title;
      const excerpt = isEn && blog.excerptEn ? blog.excerptEn : blog.excerpt;
      const content = isEn && blog.contentEn ? blog.contentEn : blog.content;
      const escapedContent = escapeXml(content || "");
      const linkSlug = blog.slug;
      
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${baseUrl}${localePrefix}/blog/${linkSlug}</link>
      <guid isPermaLink="true">${baseUrl}${localePrefix}/blog/${linkSlug}</guid>
      <pubDate>${new Date(blog.createdAt).toUTCString()}</pubDate>
      <author>JobQuip</author>
      <description>${escapeXml(excerpt || title)}</description>
      <content:encoded><![CDATA[${escapedContent}]]></content:encoded>
    </item>`;
    }).join("")}
  </channel>
</rss>`;

  return rss;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
