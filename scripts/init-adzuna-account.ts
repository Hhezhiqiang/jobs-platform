/**
 * 初始化 Adzuna 默认账号和公司
 * 运行一次即可
 */
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function initAdzunaAccount() {
  const companySlug = 'adzuna-aggregator';
  const userEmail = 'system@jobquip.com';
  
  try {
    // 1. 检查是否已存在
    const existingCompany = await prisma.companies.findUnique({
      where: { slug: companySlug }
    });

    if (existingCompany) {
      console.log('✅ 公司已存在:', existingCompany.id);
      console.log('\n📋 请将以下 ID 添加到 .env.production:');
      console.log(`ADZUNA_COMPANY_ID="${existingCompany.id}"`);
      return;
    }

    // 2. 创建系统用户 (如果没有)
    let user = await prisma.users.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('SystemAccount2026!Secure', 10);
      user = await prisma.users.create({
        data: {
          name: 'JobQuip System',
          email: userEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ 系统用户创建成功:', user.id);
    } else {
      console.log('✅ 系统用户已存在:', user.id);
    }

    // 3. 创建默认公司
    const company = await prisma.companies.create({
      data: {
        slug: companySlug,
        name: 'Adzuna Jobs',
        industry: '招聘聚合',
        description: '通过 Adzuna API 自动聚合的全球职位',
        location: 'Global'
      }
    });

    console.log('✅ 公司创建成功:', company.id);
    
    console.log('\n📋 请将以下 ID 添加到 .env.production:');
    console.log(`ADZUNA_COMPANY_ID="${company.id}"`);
    console.log(`ADZUNA_AUTHOR_ID="${user.id}"`);
    
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
initAdzunaAccount()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
