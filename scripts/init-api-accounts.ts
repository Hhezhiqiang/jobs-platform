/**
 * 初始化 Jooble 和 The Muse 的默认账号和公司
 */
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function initApiAccounts() {
  const userEmail = 'api@jobquip.com';
  
  try {
    // 1. 创建系统用户
    let user = await prisma.users.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('ApiUser2026!Secure', 10);
      user = await prisma.users.create({
        data: {
          name: 'JobQuip API',
          email: userEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ 系统用户创建成功:', user.id);
    } else {
      console.log('✅ 系统用户已存在:', user.id);
    }

    // 2. 创建 Jooble 公司
    const joobleCompany = await prisma.companies.upsert({
      where: { slug: 'jooble-jobs' },
      update: {},
      create: {
        slug: 'jooble-jobs',
        name: 'Jooble Jobs',
        industry: '招聘聚合',
        description: '通过 Jooble API 聚合的全球职位',
        location: 'Global'
      }
    });
    console.log('✅ Jooble 公司:', joobleCompany.id);

    // 3. 创建 Muse 公司
    const museCompany = await prisma.companies.upsert({
      where: { slug: 'muse-jobs' },
      update: {},
      create: {
        slug: 'muse-jobs',
        name: 'The Muse Jobs',
        industry: '招聘聚合',
        description: '通过 The Muse API 聚合的欧美职位',
        location: 'Global'
      }
    });
    console.log('✅ Muse 公司:', museCompany.id);
    
    console.log('\n📋 请将以下 ID 添加到 .env.production:');
    console.log(`JOOBLE_COMPANY_ID="${joobleCompany.id}"`);
    console.log(`MUSE_COMPANY_ID="${museCompany.id}"`);
    console.log(`JOOBLE_AUTHOR_ID="${user.id}"`);
    console.log(`MUSE_AUTHOR_ID="${user.id}"`);
    
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
initApiAccounts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
