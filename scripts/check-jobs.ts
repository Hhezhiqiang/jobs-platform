import { prisma } from './src/lib/prisma';

async function checkJobs() {
  const jobs = await prisma.jobs.findMany({
    take: 10,
    orderBy: { datePosted: 'desc' },
    select: {
      id: true,
      title: true,
      location: true,
      city: true,
      country: true,
      companyId: true,
      authorId: true,
      sourceId: true
    }
  });

  console.log('最近抓取的职位:');
  jobs.forEach(job => {
    console.log(`- ${job.title}`);
    console.log(`  地点：${job.location} | ${job.city} | ${job.country}`);
    console.log(`  公司 ID: ${job.companyId} | 作者 ID: ${job.authorId}`);
    console.log(`  来源 ID: ${job.sourceId || '无'}`);
    console.log('');
  });

  const total = await prisma.jobs.count();
  console.log(`总职位数：${total}`);

  await prisma.$disconnect();
}

checkJobs().catch(console.error);
