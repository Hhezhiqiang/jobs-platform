#!/usr/bin/env tsx
/**
 * 自动博客发布脚本
 * 使用 KIMI API 生成专业深度内容
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const KIMI_API_KEY = process.env.KIMI_API_KEY;

if (!KIMI_API_KEY) {
  console.error("❌ KIMI_API_KEY 未配置");
  process.exit(1);
}

// 加载博客话题
const blogTopicsPath = path.join(process.cwd(), "memory", "blog-topics.json");
let categories: Array<{ name: string; topics: Array<{ title: string }> }> = [];
try {
  const blogTopicsData = JSON.parse(fs.readFileSync(blogTopicsPath, "utf-8"));
  categories = blogTopicsData.categories || [];
} catch {
  console.error("⚠️ blog-topics.json 不存在，使用默认话题");
  categories = [
    { name: "求职技巧", topics: [{ title: "2026互联网大厂面试攻略" }] },
    { name: "薪资报告", topics: [{ title: "2026技术岗位薪资报告" }] },
  ];
}

/**
 * 调用 KIMI API 生成专业博客内容
 */
async function generateBlogContent(
  topic: string,
  category: string,
  existingTopics: string[] = []
): Promise<string> {
  const systemPrompt = `你是 JobsBro 招聘平台的资深内容专家，专注于互联网、科技、Web3 行业的职业发展领域。

你的写作特点：
1. **数据驱动**：引用具体数据、趋势和案例（可以使用行业通用数据，不必精确到小数点）
2. **深度分析**：不止于表面描述，深入分析背后的原因和趋势
3. **实用建议**：给求职者和招聘方可操作的建议
4. **专业术语**：使用行业通用术语，体现专业性
5. **结构清晰**：使用 Markdown 格式，标题层级分明

请生成一篇 2000-3000 字的专业博客文章。使用 Markdown 格式。
不要包含任何前言或后记，直接输出文章正文。
文章要包含具体的薪资数据、行业趋势分析、技能要求、求职建议等内容。`;

  const userPrompt = `请为 JobsBro 招聘平台撰写一篇关于"${topic}"的专业博客文章。

分类：${category}

文章要求：
1. 标题用 H1 (# )，正文用 H2/H3 分级
2. 开头写一段吸引人的引言
3. 包含行业现状分析（引用薪资数据、招聘趋势等）
4. 包含核心技能要求分析
5. 包含求职/招聘建议
6. 包含薪资水平参考（人民币/月）
7. 结尾总结
8. 最后加一行：---\n*Tags: ${category}, 求职, 职业发展*

避免和以下已有话题重复角度：
${existingTopics.slice(0, 5).map((t) => `- ${t}`).join("\n")}`;

  const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-32k",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KIMI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("KIMI API returned empty content");
  }

  return content;
}

/**
 * 生成 SEO 友好的 slug
 */
function generateSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

async function autoPublish() {
  console.log("🤖 自动博客发布系统启动...\n");

  try {
    // 1. 检查最近发布的博客
    const recentBlog = await prisma.pages.findFirst({
      where: { type: "BLOG" },
      orderBy: { createdAt: "desc" },
    });

    if (recentBlog) {
      const hoursSinceLastPost =
        (Date.now() - new Date(recentBlog.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastPost < 2) {
        console.log(
          `⏰ 距离上次发布仅 ${hoursSinceLastPost.toFixed(1)} 小时，跳过本次发布`
        );
        process.exit(0);
      }
      console.log(
        `📝 上次发布: ${recentBlog.title} (${hoursSinceLastPost.toFixed(1)} 小时前)`
      );
    }

    // 2. 获取管理员
    const admin = await prisma.users.findFirst({
      where: { role: "ADMIN" },
    });
    if (!admin) {
      console.error("❌ 未找到管理员用户");
      process.exit(1);
    }
    console.log(`👤 作者: ${admin.name}`);

    // 3. 选择话题（优先选没发过的）
    const existingBlogs = await prisma.pages.findMany({
      where: { type: "BLOG" },
      select: { title: true },
    });
    const existingTitles = existingBlogs.map((b) => b.title);

    // 找还没发过的话题
    let selectedCategory = "";
    let selectedTopic = "";

    for (const cat of categories) {
      for (const t of cat.topics) {
        if (!existingTitles.includes(t.title)) {
          selectedCategory = cat.name;
          selectedTopic = t.title;
          break;
        }
      }
      if (selectedTopic) break;
    }

    // 如果都发过了，随机选一个
    if (!selectedTopic) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      selectedCategory = cat.name;
      selectedTopic =
        cat.topics[Math.floor(Math.random() * cat.topics.length)].title;
    }

    console.log(`📌 话题: [${selectedCategory}] ${selectedTopic}\n`);

    // 4. 调用 KIMI 生成内容
    console.log("✍️  调用 KIMI API 生成专业内容...");
    const content = await generateBlogContent(
      selectedTopic,
      selectedCategory,
      existingTitles
    );

    // 从内容中提取标题（第一行如果是 H1 则作为标题）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : selectedTopic;
    const cleanContent = titleMatch
      ? content.replace(/^#\s+.+$/, "").trim()
      : content;

    console.log(`📄 标题: ${title}`);
    console.log(`📏 字数: ${cleanContent.length} 字符\n`);

    // 5. 生成 slug
    const slug = generateSlug(title);

    // 6. 提取 excerpt
    const excerpt = cleanContent
      .replace(/[#*>_`\-]/g, "")
      .substring(0, 160)
      .trim();

    // 7. 提取关键词
    const keywords = [selectedCategory, title.substring(0, 10)].filter(Boolean);

    // 8. 创建博客
    const blog = await prisma.pages.create({
      data: {
        title,
        slug: `${slug}-${Date.now()}`,
        content: cleanContent,
        excerpt,
        type: "BLOG",
        status: "PUBLISHED",
        authorId: admin.id,
        metaTitle: `${title} | JobsBro`,
        metaDescription: excerpt,
        keywords,
      },
    });

    console.log("✅ 博客发布成功！");
    console.log(`   标题: ${blog.title}`);
    console.log(`   链接: /blog/${blog.slug}`);

    // 9. 创建标记文件通知 GitHub Actions
    fs.writeFileSync(".new_blog_created", "true");
    fs.writeFileSync(".new_blog_title", blog.title);
    fs.writeFileSync(
      ".new_blog_url",
      `https://jobs-platform-gold.vercel.app/blog/${blog.slug}`
    );
  } catch (error) {
    console.error("❌ 发布失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

autoPublish();
