import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

async function main() {
  const prisma = new PrismaClient();
  
  // 查找所有管理员
  const admins = await prisma.users.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true, password: true },
  });
  
  console.log('找到管理员账户：', admins.length);
  admins.forEach((a, i) => {
    console.log(`${i + 1}. 邮箱: ${a.email}, 姓名: ${a.name}, 角色: ${a.role}`);
    console.log(`   密码哈希: ${a.password.substring(0, 30)}...`);
  });
  
  // 测试密码
  const testUser = admins[0];
  if (testUser) {
    const test1 = await bcrypt.compare('Admin@2026!', testUser.password);
    const test2 = await bcrypt.compare('admin123', testUser.password);
    console.log(`\n密码测试 (${testUser.email}):`);
    console.log('Admin@2026! 匹配:', test1);
    console.log('admin123 匹配:', test2);
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('错误：', e.message);
  process.exit(1);
});
