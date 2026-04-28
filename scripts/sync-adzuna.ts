/**
 * 每日自动同步 Adzuna 职位
 * 建议配置 cron: 0 2 * * * (每日凌晨 2 点)
 */

import { fetchAdzunaBulkJobs } from '@/lib/adzuna-api';

async function syncAdzunaJobs() {
  console.log('开始同步 Adzuna 职位...');
  
  try {
    const count = await fetchAdzunaBulkJobs();
    console.log(`Adzuna 同步完成：新增 ${count} 个职位`);
  } catch (error: any) {
    console.error('Adzuna 同步失败:', error.message);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  syncAdzunaJobs()
    .then(() => {
      console.log('同步完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('同步失败:', error);
      process.exit(1);
    });
}

export { syncAdzunaJobs };
