#!/usr/bin/env tsx
/**
 * 自动博客发布脚本
 * 用于 GitHub Actions 定时任务
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// 加载博客话题
const blogTopicsPath = path.join(process.cwd(), "memory", "blog-topics.json");
const blogTopicsData = JSON.parse(fs.readFileSync(blogTopicsPath, "utf-8"));
const blogTopics = blogTopicsData.topics || blogTopicsData;

// 模拟博客内容生成（实际应该调用AI API）
async function generateBlogContent(topic: string, category: string): Promise<string> {
  // 这里应该是调用 OpenAI/Claude API 生成内容
  // 现在先用模板内容
  const date = new Date().toLocaleDateString("zh-CN");
  
  return `# ${topic}

> 本文由 JobsBro 原创出品，转载请注明出处。

## 引言

在当前的互联网行业，${topic}已经成为从业者关注的焦点。本文将深入分析这一领域的核心要点，为求职者和招聘方提供有价值的洞见。

## 行业现状分析

根据最新市场调研数据，${category}领域呈现出以下趋势：

1. **需求持续增长** - 招聘量同比增长 35%
2. **薪资水平提升** - 平均薪资上涨 20-30%
3. **技能要求升级** - 新技术栈快速迭代

## 核心技能要求

### 技术能力
- 扎实的专业基础
- 持续学习的能力
- 解决复杂问题的经验

### 软技能
- 沟通协作能力
- 项目管理经验
- 跨部门协调能力

## 求职建议

1. **简历优化** - 突出项目经验和量化成果
2. **面试准备** - 关注行业动态和技术趋势
3. **职业规划** - 明确发展方向和里程碑

## 结语

${topic}是一个充满机遇的领域。希望本文能为你的职业发展提供有价值的参考。

---

*发布日期: ${date}*  
*作者: JobsBro*  
*标签: ${category}, 求职, 职业发展*
`;
}

async function autoPublish() {
  console.log("🤖 自动博客发布系统启动...\n");
  
  try {
    // 1. 检查最近发布的博客
    const recentBlog = await prisma.page.findFirst({
      where: { type: "BLOG" },
      orderBy: { createdAt: "desc" },
    });
    
    if (recentBlog) {
      const hoursSinceLastPost = (Date.now() - recentBlog.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastPost < 2) {
        console.log(`⏰ 距离上次发布仅 ${hoursSinceLastPost.toFixed(1)} 小时，跳过本次发布`);
        console.log(`   上次发布: ${recentBlog.title}`);
        process.exit(0);
      }
    }
    
    // 2. 获取管理员
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      console.error("❌ 未找到管理员用户");
      process.exit(1);
    }
    
    // 3. 随机选择话题
    const categories = Object.keys(blogTopics);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const topics = blogTopics[randomCategory as keyof typeof blogTopics];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    console.log(`📌 选择话题: [${randomCategory}] ${randomTopic}`);
    
    // 4. 生成内容
    console.log("✍️  生成博客内容...");
    const content = await generateBlogContent(randomTopic, randomCategory);
    
    // 5. 生成 slug
    const timestamp = Date.now();
    const slug = `${randomTopic.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")}-${timestamp}`;
    
    // 6. 创建博客
    const blog = await prisma.page.create({
      data: {
        title: randomTopic,
        slug: slug,
        content: content,
        excerpt: content.substring(0, 200) + "...",
        type: "BLOG",
        status: "PUBLISHED",
        authorId: admin.id,
        metaTitle: `${randomTopic} | JobsBro`,
        metaDescription: `深入了解${randomTopic}，获取最新行业洞察和求职建议。`,
      },
    });
    
    console.log("\n✅ 博客发布成功！");
    console.log(`   标题: ${blog.title}`);
    console.log(`   链接: /blog/${blog.slug}`);
    
    // 7. 创建标记文件，通知 GitHub Actions 部署
    const fs = require("fs");
    fs.writeFileSync(".new_blog_created", "true");
    fs.writeFileSync(".new_blog_title", blog.title);
    fs.writeFileSync(".new_blog_url", `https://jobs-platform-gold.vercel.app/blog/${blog.slug}`);
    
  } catch (error) {
    console.error("❌ 发布失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

autoPublish();
