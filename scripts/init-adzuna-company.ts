/**
 * 初始化 Adzuna 默认公司
 * 运行一次即可
 */
import { prisma } from '../src/lib/prisma';

async function initAdzunaCompany() {
  const companySlug = 'adzuna-jobs';
  
  try {
    // 检查是否已存在
    const existing = await prisma.companies.findUnique({
      where: { slug: companySlug }
    });

    if (existing) {
      console.log('Adzuna 公司已存在:', existing.id);
      return existing.id;
    }

    // 创建默认公司
    const company = await prisma.companies.create({
      data: {
        slug: companySlug,
        name: 'Adzuna Jobs',
        industry: 'Job Aggregator',
        description: 'Automatically aggregated jobs from Adzuna API',
        location: 'Global'
      }
    });

    console.log('✅ Adzuna 公司创建成功:', company.id);
    return company.id;
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
initAdzunaCompany()
  .then(id => {
    if (id) {
      console.log('\n📋 请将此 ID 添加到 .env.production:');
      console.log(`ADZUNA_COMPANY_ID="${id}"`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
