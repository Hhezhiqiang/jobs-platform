/**
 * Auto Blog Publisher - GitHub Actions 入口脚本
 * 
 * 流程：
 * 1. 查找 NEW 状态的高价值关键字监控
 * 2. 运行专题页发布流水线 + 博客自动生成流水线
 * 3. 自动发布草稿
 * 4. 更新 monitors 状态为 PUBLISHED
 * 5. 写入 GitHub Actions 输出文件
 */

import { PrismaClient } from "@prisma/client";
import { runAutoPipeline } from "../src/lib/auto-publisher";
import { runAutoBlogPipeline } from "../src/lib/auto-blog-generator";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();
const AUTO_PUBLISH_ENABLED = process.env.AUTO_PUBLISH_ENABLED === "true";

async function main() {
  console.log("[auto-blog-publish] Starting...");

  if (!AUTO_PUBLISH_ENABLED) {
    console.log("[auto-blog-publish] AUTO_PUBLISH_ENABLED is not 'true', skipping.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  // 查找待处理的关键字监控（高价值、未发布）
  const pendingMonitors = await prisma.keyword_monitors.findMany({
    where: {
      status: "NEW",
      trendScore: { gte: 40 },
    },
    orderBy: { trendScore: "desc" },
    take: 5,
  });

  console.log(`[auto-blog-publish] Found ${pendingMonitors.length} pending monitors`);

  if (pendingMonitors.length === 0) {
    console.log("[auto-blog-publish] No pending monitors, exiting.");
    return;
  }

  const monitorIds = pendingMonitors.map((m) => m.id);

  // 运行专题页自动发布流水线
  const topicResult = await runAutoPipeline(monitorIds);
  console.log(`[auto-blog-publish] Topic pipeline: ${topicResult.published} published, ${topicResult.errors} errors`);

  // 运行博客自动发布流水线
  const blogResult = await runAutoBlogPipeline(monitorIds);
  console.log(`[auto-blog-publish] Blog pipeline: ${blogResult.drafted} drafted, ${blogResult.errors} errors`);

  // 更新 monitors 状态为 PUBLISHED
  if (pendingMonitors.length > 0) {
    await prisma.keyword_monitors.updateMany({
      where: { id: { in: monitorIds } },
      data: { status: "PUBLISHED" },
    });
    console.log(`[auto-blog-publish] Updated ${monitorIds.length} monitors to PUBLISHED`);
  }

  // 自动发布所有草稿
  const drafts = await prisma.pages.updateMany({
    where: { type: { in: ["BLOG", "PAGE"] }, status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });
  if (drafts.count > 0) {
    console.log(`[auto-blog-publish] Published ${drafts.count} drafts`);
  }

  const totalPublished = topicResult.published + blogResult.drafted;

  if (totalPublished > 0) {
    const fs = await import("fs");
    const latestPage = await prisma.pages.findFirst({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: new Date(Date.now() - 60000 * 10) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestPage) {
      const url = latestPage.type === "PAGE"
        ? `/topics/${latestPage.slug}`
        : `/blog/${latestPage.slug}`;

      fs.writeFileSync(".new_blog_created", "true");
      fs.writeFileSync(".new_blog_title", latestPage.title);
      fs.writeFileSync(".new_blog_url", url);

      console.log(`[auto-blog-publish] New content published: ${latestPage.title} -> ${url}`);
    }
  } else {
    console.log("[auto-blog-publish] No new content to publish.");
  }

  // 汇总
  const totalBlogs = await prisma.pages.count({ where: { type: "BLOG", status: "PUBLISHED" } });
  const totalTopics = await prisma.pages.count({ where: { type: "PAGE", status: "PUBLISHED" } });
  console.log(`[auto-blog-publish] Total published: ${totalBlogs} blogs + ${totalTopics} topics = ${totalBlogs + totalTopics}`);
}

main()
  .catch((err) => {
    logger.error("[auto-blog-publish] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
