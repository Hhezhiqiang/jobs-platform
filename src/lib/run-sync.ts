import { prisma } from './prisma';

async function syncAndCheck() {
  console.log('=== Adzuna 职位同步 ===\n');

  // 1. 检查当前数量
  const countBefore = await prisma.jobs.count({
    where: { slug: { startsWith: 'adzuna-' } },
  });
  console.log(`[1] 同步前 Adzuna 职位数: ${countBefore}`);

  // 2. 增量同步（不再删除旧数据）
  console.log('\n[2] 开始增量同步...');
  const { fetchAdzunaBulkJobs } = await import('./adzuna-api');

  const result = await fetchAdzunaBulkJobs({
    pages: 3,
    onProgress: (p) => {
      console.log(`  [${p.phase.toUpperCase()}] ${p.message}`);
    },
  });

  console.log(`\n[3] 同步结果:`);
  console.log(`  从 API 抓取: ${result.fetched} 个职位`);
  console.log(`  新增入库:   ${result.inserted} 个`);
  console.log(`  重复跳过:   ${result.skipped} 个`);
  console.log(`  失败:       ${result.failed} 个`);
  console.log(`  AI 调用:    ~${result.aiCalls} 次`);

  // 3. 验证数据质量
  console.log('\n[4] 验证数据质量...');
  const totalAfter = await prisma.jobs.count({
    where: { slug: { startsWith: 'adzuna-' } },
  });
  console.log(`  同步后总数: ${totalAfter}`);

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
    console.log(`\n  职位 ${i + 1}: ${job.title}`);
    console.log(`    地点: ${job.city}, ${job.location}`);
    console.log(`    类型: ${job.employmentType}`);
    console.log(`    职责: ${job.description?.substring(0, 50)}...`);
    console.log(`    要求: ${job.requirements ? '✅' : '❌'}`);
    console.log(`    福利: ${job.benefits ? '✅' : '❌'}`);
  });

  console.log(`\n  有任职要求: ${withRequirements}/${jobs.length}`);
  console.log(`  有福利待遇: ${withBenefits}/${jobs.length}`);

  await prisma.$disconnect();
}

syncAndCheck().catch(console.error);
