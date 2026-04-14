#!/usr/bin/env tsx
/**
 * 关键词采集与SEO计划生成脚本
 * 定期运行以发现新的热词并生成SEO计划
 * 
 * 优化点:
 * - 并行获取多个数据源，带15秒超时
 * - 规则分类替代LLM分类（更快更稳定）
 * - 批量数据库操作
 * - 详细的执行统计
 */

import { collectKeywords } from "../src/lib/keyword-monitor";
import { generateSEOPlan } from "../src/lib/seo-plan";
import { prisma } from "../src/lib/prisma";

async function main() {
  const startTime = Date.now();
  console.log("\n" + "=".repeat(60));
  console.log(`[${new Date().toISOString()}] 关键词采集任务启动`);
  console.log("=".repeat(60));

  let exitCode = 0;

  try {
    // 1. 采集新关键词
    const result = await collectKeywords();
    
    console.log("\n📊 数据源统计:");
    for (const stat of result.stats) {
      const icon = stat.status === "ok" ? "✓" : "✗";
      console.log(`   ${icon} ${stat.adapter}: ${stat.count} 条 ${stat.status !== "ok" ? `(${stat.status})` : ""}`);
    }

    console.log(`\n📈 处理结果:`);
    console.log(`   • 新增关键词: ${result.inserted}`);
    console.log(`   • 重复更新: ${result.duplicates}`);
    console.log(`   • 处理错误: ${result.errors}`);

    // 2. 为高热词生成SEO计划
    if (result.newIds.length > 0) {
      console.log(`\n🎯 检查 SEO 计划生成...`);
      
      const highValueKeywords = await prisma.keyword_monitors.findMany({
        where: {
          id: { in: result.newIds },
          trendScore: { gte: 60 },
          category: { in: ["PRIMARY", "TRAFFIC"] },
        },
        take: 5,
      });

      console.log(`   发现 ${highValueKeywords.length} 个高价值关键词`);

      let seoPlansCreated = 0;
      for (const monitor of highValueKeywords) {
        try {
          const existingPlan = await prisma.seo_plans.findFirst({
            where: { monitorId: monitor.id },
          });
          
          if (!existingPlan) {
            await generateSEOPlan(monitor.id);
            console.log(`   ✓ SEO计划生成: ${monitor.keyword}`);
            seoPlansCreated++;
          } else {
            console.log(`   ⏭ 已存在计划: ${monitor.keyword}`);
          }
        } catch (e) {
          console.error(`   ✗ SEO计划失败 [${monitor.keyword}]:`, (e as Error).message);
        }
      }
      
      console.log(`\n   新建 SEO 计划: ${seoPlansCreated}/${highValueKeywords.length}`);
    } else {
      console.log(`\n⏭ 无新关键词，跳过 SEO 计划生成`);
    }

    const elapsed = Date.now() - startTime;
    console.log("\n" + "=".repeat(60));
    console.log(`✅ 任务完成 (${elapsed}ms)`);
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error("\n" + "=".repeat(60));
    console.error(`❌ 任务失败 (${elapsed}ms)`);
    console.error("错误详情:", (error as Error).message);
    console.error("=".repeat(60) + "\n");
    exitCode = 1;
  }

  // 确保断开数据库连接
  await prisma.$disconnect();
  process.exit(exitCode);
}

main();
