/**
 * 发布新的干净职位数据
 * 用法: npx tsx scripts/publish-clean-jobs.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== 准备发布新职位 ===');
  console.log('请在数据库中手动添加职位，或等待后续自动导入脚本');
}

main().catch(console.error).finally(() => prisma.$disconnect());
