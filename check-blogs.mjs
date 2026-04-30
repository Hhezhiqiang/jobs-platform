import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查博客文章状态...\n');
  
  // 查询所有博客
  const blogs = await prisma.pages.findMany({
    where: { type: 'BLOG' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      content: true,
      createdAt: true,
    },
    take: 10,
  });
  
  console.log(`总共找到 ${blogs.length} 篇博客：\n`);
  blogs.forEach((b, i) => {
    console.log(`${i+1}. 标题: ${b.title}`);
    console.log(`   Slug: ${b.slug}`);
    console.log(`   状态: ${b.status}`);
    console.log(`   内容长度: ${b.content?.length || 0} 字符`);
    console.log('');
  });
  
  // 检查是否有 PUBLISHED 状态的博客
  const publishedCount = blogs.filter(b => b.status === 'PUBLISHED').length;
  console.log(`\nPUBLISHED 状态: ${publishedCount}/${blogs.length}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
