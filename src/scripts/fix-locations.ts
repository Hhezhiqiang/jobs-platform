/**
 * 修复已抓取职位的地点信息
 */
import { prisma } from '../src/lib/prisma';

async function fixJobLocations() {
  console.log('开始修复地点信息...');
  
  // 查找所有 Adzuna 抓取的职位
  const jobs = await prisma.jobs.findMany({
    where: {
      sourceId: { not: null }
    },
    take: 500
  });

  let fixed = 0;
  for (const job of jobs) {
    try {
      // 从 sourceId 提取信息 (格式：adzuna-12345)
      if (!job.sourceId?.startsWith('adzuna-')) continue;
      
      // 更新 city 字段（如果为空）
      if (!job.city && job.location) {
        const city = job.location.split(',').pop()?.trim() || job.location;
        await prisma.jobs.update({
          where: { id: job.id },
          data: { city }
        });
        fixed++;
      }
    } catch (error: any) {
      console.error(`Failed to fix job ${job.id}:`, error.message);
    }
  }

  console.log(`✅ 修复完成！共修复 ${fixed} 个职位`);
  await prisma.$disconnect();
}

fixJobLocations().catch(console.error);
