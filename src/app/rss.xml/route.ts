import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  // 获取最新博客
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      createdAt: true,
    },
  });

  // 生成RSS XML（多语言版本，链接带 locale 前缀）
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>JobQuip招聘平台 - 求职博客</title>
    <link>${baseUrl}/zh/blog</link>
    <description>专业的互联网求职博客，提供最新薪资报告、大厂面试攻略、简历优化技巧、职业规划指南。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${blogs.map(blog => {
      const content = escapeXml(blog.content);
      
      return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${baseUrl}/zh/blog/${blog.slug}</link>
      <guid isPermaLink="true">${baseUrl}/zh/blog/${blog.slug}</guid>
      <pubDate>${new Date(blog.createdAt).toUTCString()}</pubDate>
      <author>JobQuip编辑</author>
      <description>${escapeXml(blog.excerpt || blog.title)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`;
    }).join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
