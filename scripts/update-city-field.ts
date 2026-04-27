import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCityFields() {
  console.log('开始更新 Jobs 表的 city 字段...\n');

  // 定义 location 到 city 的映射规则
  const updates = [
    { location: 'Remote', city: '远程' },
    { location: '远程', city: '远程' },
    { location: '%北京%', city: '北京' },
    { location: '%上海%', city: '上海' },
    { location: '%深圳%', city: '深圳' },
    { location: '%杭州%', city: '杭州' },
    { location: '%广州%', city: '广州' },
    { location: '%成都%', city: '成都' },
    { location: '%武汉%', city: '武汉' },
    { location: '%西安%', city: '西安' },
    { location: '%南京%', city: '南京' },
    { location: '%苏州%', city: '苏州' },
  ];

  let totalUpdated = 0;

  for (const { location, city } of updates) {
    try {
      const isPattern = location.includes('%');
      const where = isPattern 
        ? { location: { contains: location.replace(/%/g, '') } }
        : { location };

      const result = await prisma.jobs.updateMany({
        where: {
          ...where,
          city: { equals: '' }, // 只更新 city 为空的记录
        },
        data: { city },
      });

      console.log(`✓ ${location} → ${city}: 更新了 ${result.count} 条记录`);
      totalUpdated += result.count;
    } catch (error) {
      console.error(`✗ ${location} → ${city}: 失败`, error);
    }
  }

  console.log(`\n✅ 完成！共更新 ${totalUpdated} 条记录`);

  // 验证结果
  const stats = await prisma.jobs.groupBy({
    by: ['city'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log('\n📊 城市分布统计:');
  stats.forEach(({ city, _count }) => {
    console.log(`  ${city || '(空)'}: ${_count.id} 个职位`);
  });

  await prisma.$disconnect();
}

updateCityFields().catch(console.error);
