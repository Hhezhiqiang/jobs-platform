import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('测试博客查询 (with all fields)...');
  try {
    const posts = await prisma.pages.findMany({
      where: { type: 'BLOG' },
      include: { users: true },
      skip: 0,
      take: 15,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ 成功，找到 ${posts.length} 篇博客`);
    posts.forEach((p, i) => {
      console.log(`${i+1}. ${p.title.substring(0, 40)}... | 作者: ${p.users?.name || '未知'} | 状态: ${p.status}`);
    });
  } catch (e) {
    console.error('❌ 查询失败:', e.message);
    console.error('Code:', e.code);
    console.error('Meta:', e.meta);
  }
  
  await prisma.$disconnect();
}

main();
