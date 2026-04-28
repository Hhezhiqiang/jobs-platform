import { prisma } from './prisma';

async function syncAndCheck() {
  console.log('1. 检查当前 Adzuna 职位数量...');
  const countBefore = await prisma.jobs.count({
    where: { slug: { startsWith: 'adzuna-' } }
  });
  console.log(`当前数量: ${countBefore}`);

  console.log('\n2. 清理旧数据...');
  const deleted = await prisma.jobs.deleteMany({
    where: { slug: { startsWith: 'adzuna-' } }
  });
  console.log(`已删除: ${deleted.count}`);

  console.log('\n3. 开始抓取新数据...');
  const { fetchAdzunaJobs } = await import('./adzuna-api');
  
  // 抓取伦敦的软件工程师
  const saved = await fetchAdzunaJobs('software engineer', 'London', 1, 'gb');
  console.log(`\n4. 抓取结果: 新增 ${saved} 个职位`);

  console.log('\n5. 验证数据质量...');
  const jobs = await prisma.jobs.findMany({
    where: { slug: { startsWith: 'adzuna-' } },
    take: 3,
    select: {
      title: true,
      location: true,
      city: true,
      description: true,
      requirements: true,
      benefits: true
    }
  });

  jobs.forEach((job, i) => {
    console.log(`\n--- 职位 ${i + 1} ---`);
    console.log(`标题: ${job.title}`);
    console.log(`地点: ${job.city}, ${job.location}`);
    console.log(`岗位职责: ${job.description?.substring(0, 50)}...`);
    console.log(`任职要求: ${job.requirements ? '✅ 已提取' : '❌ 缺失'}`);
    console.log(`福利待遇: ${job.benefits ? '✅ 已提取' : '❌ 缺失'}`);
  });

  await prisma.$disconnect();
}

syncAndCheck().catch(console.error);
