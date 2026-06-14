/**
 * 直接调用 Adzuna 同步函数，绕过 session 验证
 * 运行: npx tsx scripts/trigger-sync.ts
 */
import { fetchAdzunaBulkJobs } from '../src/lib/adzuna-api';

async function main() {
  console.log('🚀 开始全球岗位同步...');
  console.log('  配置: 20 个国家 × 55 个城市 × 30 个关键词');
  console.log('  每国抓取 2 页（约 100 条/页）');
  console.log('');

  const startTime = Date.now();

  try {
    const result = await fetchAdzunaBulkJobs({
      pages: 2,
      onProgress: (progress) => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(
          `[${elapsed}s] ${progress.phase}: ` +
          `获取=${progress.fetched} 解析=${progress.parsed} ` +
          `新增=${progress.inserted} 跳过=${progress.skipped} 失败=${progress.failed} ` +
          `AI调用=${progress.aiCalls} ${progress.message || ''}`
        );
      },
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log('');
    console.log('✅ 同步完成！');
    console.log(`  耗时: ${elapsed}s`);
    console.log(`  获取: ${result.fetched} 条`);
    console.log(`  新增: ${result.inserted} 条`);
    console.log(`  跳过: ${result.skipped} 条（重复）`);
    console.log(`  失败: ${result.failed} 条`);
    console.log(`  AI调用: ${result.aiCalls} 次`);
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

main();