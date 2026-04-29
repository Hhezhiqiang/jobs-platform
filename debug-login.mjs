import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

async function main() {
  const prisma = new PrismaClient();
  
  const email = 'admin@example.com';
  const password = 'Admin@2026!';
  
  // 1. 查找用户
  const user = await prisma.users.findUnique({ 
    where: { email },
    select: { id: true, email: true, name: true, role: true, password: true, status: true }
  });
  
  console.log('查询结果:', user ? '找到用户' : '未找到用户');
  if (user) {
    console.log('用户信息:', { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status });
    console.log('密码哈希前缀:', user.password.substring(0, 20));
    
    // 2. 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isValid ? '✅ 正确' : '❌ 错误');
    
    // 3. 测试旧密码
    const oldValid = await bcrypt.compare('admin123', user.password);
    console.log('旧密码 admin123:', oldValid ? '✅ 正确' : '❌ 错误');
    
    // 4. 检查密码哈希格式
    const parts = user.password.split('$');
    console.log('哈希格式:', `版本=${parts[1]}, 成本=${parts[2]}, 盐=${parts[3]?.substring(0, 10)}...`);
  } else {
    // 查找所有用户
    const allAdmins = await prisma.users.findMany({ where: { role: 'ADMIN' } });
    console.log('所有管理员:');
    allAdmins.forEach(a => console.log(` - ${a.email} (${a.role})`));
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('错误：', e.message);
  process.exit(1);
});
