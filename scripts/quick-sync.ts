/**
 * 直接调用 adzuna-api 的 fetchAdzunaBulkJobs
 * 每 20 秒汇报一次进度，减少日志输出
 */
import { fetchAdzunaBulkJobs } from '../src/lib/adzuna-api';

async function main() {
  let lastLog = Date.now();
  const startTime = Date.now();

  console.log('🚀 开始同步...');

  const result = await fetchAdzunaBulkJobs({
    pages: 2,
    onProgress: (p) => {
      // 只有入库阶段或每 20 秒才 log
      const now = Date.now();
      if (p.inserted > 0 || p.skipped > 0 || p.phase === 'done' || p.phase === 'error' || now - lastLog > 20000) {
        lastLog = now;
        const elapsed = Math.round((now - startTime) / 1000);
        console.log(`[${elapsed}s] ${p.phase}: 抓取=${p.fetched} 新增=${p.inserted} 跳过=${p.skipped} 失败=${p.failed} AI=${p.aiCalls} ${p.message || ''}`);
      }
    },
  });

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('');
  console.log('✅ 同步完成!');
  console.log(`  耗时: ${elapsed}s`);
  console.log(`  获取: ${result.fetched}`);
  console.log(`  新增: ${result.inserted}`);
  console.log(`  跳过: ${result.skipped}`);
  console.log(`  失败: ${result.failed}`);
  console.log(`  AI调用: ${result.aiCalls}`);
}

main();