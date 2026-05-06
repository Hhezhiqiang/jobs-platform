/**
 * Adzuna 职位同步脚本
 * 用法: npx tsx scripts/sync-adzuna.ts [--pages 3]
 */

import { fetchAdzunaBulkJobs } from "../src/lib/adzuna-api";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL || "";
  }

  const args = process.argv.slice(2);
  const pagesIndex = args.indexOf("--pages");
  const pages = pagesIndex >= 0 ? parseInt(args[pagesIndex + 1]) || 2 : 2;

  console.log(`[sync-adzuna] 开始同步，抓取 ${pages} 页...`);
  console.log(`[sync-adzuna] API: app_id=${process.env.ADZUNA_APP_ID}`);
  console.log(`[sync-adzuna] 国家: ${process.env.ADZUNA_COUNTRIES || 'gb,us,sg,ae,de,ca,au'}`);

  const before = await prisma.jobs.count({
    where: { companyId: process.env.ADZUNA_COMPANY_ID || "" },
  });

  let lastMessage = "";
  const result = await fetchAdzunaBulkJobs({
    pages,
    onProgress: (p) => {
      if (p.message !== lastMessage) {
        console.log(`[${p.phase}] ${p.message}`);
        lastMessage = p.message;
      }
    },
  });

  const after = await prisma.jobs.count({
    where: { companyId: process.env.ADZUNA_COMPANY_ID || "" },
  });

  console.log("\n=== 同步结果 ===");
  console.log(`抓取: ${result.fetched}`);
  console.log(`新增: ${result.inserted}`);
  console.log(`跳过(重复): ${result.skipped}`);
  console.log(`失败: ${result.failed}`);
  console.log(`AI 调用: ~${result.aiCalls}`);
  console.log(`同步前: ${before} | 同步后: ${after}`);
  console.log(`总计: ${after} 个 Adzuna 职位`);
}

main()
  .catch((err) => {
    console.error("同步失败:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
