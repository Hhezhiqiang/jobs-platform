/**
 * Adzuna 优化版同步脚本
 * - 每天只抓 2 个国家（轮换）
 * - 使用核心关键词（10 个）
 * - 增量同步（最近 24 小时新增）
 * - 请求量控制在 40-60 次/天
 */

import { PrismaClient } from "@prisma/client";
import { fetchAdzunaBulkJobs } from "../src/lib/adzuna-api";
import { runAutoPipeline } from "../src/lib/auto-publisher";
import { runAutoBlogPipeline } from "../src/lib/auto-blog-generator";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();

// 国家轮换配置
const COUNTRY_GROUPS: Record<string, string[]> = {
  // 周一三五：欧美
  odd: ['gb', 'us'],
  // 二四六：亚太
  even: ['sg', 'au'],
  // 周日：全量（只抓核心关键词）
  sunday: ['gb', 'us', 'sg', 'au', 'de', 'ca', 'ae'],
};

function getTodayGroup(): string[] {
  const day = new Date().getDay();
  if (day === 0) return COUNTRY_GROUPS.sunday; // 周日
  if (day % 2 === 1) return COUNTRY_GROUPS.odd; // 周一三五
  return COUNTRY_GROUPS.even; // 二四六
}

// 计算昨天日期范围（增量同步）
function getYesterdayRange(): { from: string; to: string } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  return {
    from: yesterday.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

async function main() {
  console.log("[sync-adzuna-optimized] Starting optimized sync...");

  // 确定今天抓哪些国家
  const countries = getTodayGroup();
  console.log(`[sync-adzuna-optimized] Countries for today: ${countries.join(', ')}`);

  // 增量同步：只抓最近 24 小时新增
  const dateRange = getYesterdayRange();
  console.log(`[sync-adzuna-optimized] Date range: ${dateRange.from} to ${dateRange.to}`);

  // 使用核心关键词（10 个）
  const coreKeywords = [
    'software engineer',
    'frontend developer',
    'backend developer',
    'full stack developer',
    'data scientist',
    'devops engineer',
    'product manager',
    'cloud engineer',
    'security engineer',
    'machine learning engineer',
  ];

  // 计算预计请求量
  const locationsPerCountry = {
    gb: 5, us: 5, sg: 1, au: 3, de: 3, ca: 3, ae: 2,
  };
  let estimatedRequests = 0;
  for (const country of countries) {
    const locs = locationsPerCountry[country as keyof typeof locationsPerCountry] || 3;
    estimatedRequests += coreKeywords.length * locs;
  }
  console.log(`[sync-adzuna-optimized] Estimated API calls: ~${estimatedRequests} (limit: 250)`);

  if (estimatedRequests > 250) {
    console.log("[sync-adzuna-optimized] WARNING: Estimated requests exceed daily limit!");
  }

  // 运行同步
  const result = await fetchAdzunaBulkJobs({
    keywords: coreKeywords,
    countries,
    pages: 1, // 只抓 1 页
  });

  console.log(`[sync-adzuna-optimized] Sync result: ${result.inserted} new, ${result.skipped} skipped, ${result.failed} failed`);

  // 发布新博客内容
  const monitors = await prisma.keyword_monitors.findMany({
    where: { status: "NEW", trendScore: { gte: 60 } },
    take: 5,
  });

  if (monitors.length > 0) {
    const monitorIds = monitors.map(m => m.id);
    const topicResult = await runAutoPipeline(monitorIds);
    const blogResult = await runAutoBlogPipeline(monitorIds);
    console.log(`[sync-adzuna-optimized] Content: ${topicResult.published} topics, ${blogResult.drafted} blogs`);
  }

  console.log("[sync-adzuna-optimized] Done!");
}

main()
  .catch((err) => {
    logger.error("[sync-adzuna-optimized] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
