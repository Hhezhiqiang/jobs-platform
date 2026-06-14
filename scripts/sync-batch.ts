/**
 * 分国家批量同步，跑完一个国家就入库
 */
import { fetchAdzunaBulkJobs } from '../src/lib/adzuna-api';

const BATCH_COUNTRIES = [
  ['gb', 'us'],
  ['sg', 'ae'],
  ['de', 'ca', 'au'],
  ['jp', 'fr', 'in'],
  ['nl', 'br', 'ch'],
  ['se', 'ie', 'it'],
  ['es', 'pl', 'kr', 'hk'],
];

async function main() {
  const batch = process.argv[2] ? parseInt(process.argv[2]) : 0;
  if (batch >= BATCH_COUNTRIES.length) {
    console.log('All batches done!');
    return;
  }

  const countries = BATCH_COUNTRIES[batch];
  console.log(`🚀 Batch ${batch + 1}/${BATCH_COUNTRIES.length}: ${countries.join(', ')}`);

  const startTime = Date.now();
  try {
    const result = await fetchAdzunaBulkJobs({
      pages: 2,
      countries,
      onProgress: (p) => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        if (p.phase === 'done' || p.phase === 'error' || p.inserted > 0 || p.skipped > 0) {
          console.log(`[${elapsed}s] ${p.phase}: 获取=${p.fetched} 新增=${p.inserted} 跳过=${p.skipped} 失败=${p.failed} AI=${p.aiCalls}`);
        }
      },
    });
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Batch ${batch + 1} done: ${elapsed}s | 新增=${result.inserted} 跳过=${result.skipped} 失败=${result.failed} AI=${result.aiCalls}`);
  } catch (e) {
    console.error(`❌ Batch ${batch + 1} error:`, e);
  }
}

main();