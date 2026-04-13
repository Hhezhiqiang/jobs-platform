import { prisma } from "@/lib/prisma";

function escapeXml(str: string): string {
  return str
    .replace(/\u0026/g, "\u0026amp;")
    .replace(/\u003c/g, "\u0026lt;")
    .replace(/\u003e/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026apos;");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

  const posts = await prisma.page.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { name: true } } },
  });

  const xml = `\u003c?xml version="1.0" encoding="UTF-8"?\u003e
\u003crss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"\u003e
  \u003cchannel\u003e
    \u003ctitle\u003eJobsBro招聘博客\u003c/title\u003e
    \u003clink\u003e${siteUrl}/blog\u003c/link\u003e
    \u003cdescription\u003e求职技巧、行业洞察、职场指南 - JobsBro招聘平台官方博客\u003c/description\u003e
    \u003clanguage\u003ezh-cn\u003c/language\u003e
    \u003clastBuildDate\u003e${new Date().toUTCString()}\u003c/lastBuildDate\u003e
    \u003catom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" /\u003e
    ${posts
      .map(
        (post) => `
    \u003citem\u003e
      \u003ctitle\u003e${escapeXml(post.title)}\u003c/title\u003e
      \u003clink\u003e${siteUrl}/blog/${post.slug}\u003c/link\u003e
      \u003cguid isPermaLink="true"\u003e${siteUrl}/blog/${post.slug}\u003c/guid\u003e
      \u003cpubDate\u003e${new Date(post.createdAt).toUTCString()}\u003c/pubDate\u003e
      \u003cdescription\u003e${escapeXml(post.excerpt || post.content.slice(0, 200))}\u003c/description\u003e
      \u003cauthor\u003e${escapeXml(post.author?.name || "JobsBro")}\u003c/author\u003e
    \u003c/item\u003e`
      )
      .join("")}
  \u003c/channel\u003e
\u003c/rss\u003e`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
