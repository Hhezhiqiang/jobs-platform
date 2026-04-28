import { prisma } from '../src/lib/prisma';

async function deleteAdzunaJobs() {
  console.log('开始删除 Adzuna 抓取的职位...');
  
  const result = await prisma.jobs.deleteMany({
    where: {
      sourceId: { startsWith: 'adzuna-' }
    }
  });

  console.log(`✅ 已删除 ${result.count} 个职位`);
  await prisma.$disconnect();
}

deleteAdzunaJobs().catch(console.error);
