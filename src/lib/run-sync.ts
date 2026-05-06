import { prisma } from './prisma';
import { logger } from '@/lib/logger';

async function syncAndCheck() {

  // 1. 检查当前数量
  const countBefore = await prisma.jobs.count({
    where: { slug: { startsWith: 'adzuna-' } },
  });

  // 2. 增量同步（不再删除旧数据）
  const { fetchAdzunaBulkJobs } = await import('./adzuna-api');

  const result = await fetchAdzunaBulkJobs({
    pages: 3,
    onProgress: (p) => {
    },
  });


  // 3. 验证数据质量
  const totalAfter = await prisma.jobs.count({
    where: { slug: { startsWith: 'adzuna-' } },
  });

  const jobs = await prisma.jobs.findMany({
    where: { slug: { startsWith: 'adzuna-' } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      title: true,
      location: true,
      city: true,
      description: true,
      requirements: true,
      benefits: true,
      employmentType: true,
    },
  });

  let withRequirements = 0;
  let withBenefits = 0;

  jobs.forEach((job, i) => {
    if (job.requirements) withRequirements++;
    if (job.benefits) withBenefits++;
  });


  await prisma.$disconnect();
}

syncAndCheck().catch(logger.error);
