/**
 * 批量抓取 Adzuna 海外职位
 * 支持国家：gb, us, sg, de, fr, au, in 等
 */
import { fetchAdzunaJobs } from '@/lib/adzuna-api';

const COUNTRIES = [
  { code: 'gb', name: '英国', cities: ['London', 'Manchester', 'Birmingham'] },
  { code: 'us', name: '美国', cities: ['New York', 'San Francisco', 'Seattle'] },
  { code: 'sg', name: '新加坡', cities: ['Singapore'] },
  { code: 'de', name: '德国', cities: ['Berlin', 'Munich', 'Frankfurt'] },
  { code: 'au', name: '澳洲', cities: ['Sydney', 'Melbourne'] },
];

const KEYWORDS = [
  'software engineer',
  'frontend developer',
  'backend developer',
  'fullstack developer',
  'devops engineer',
  'data scientist',
  'product manager',
  'ux designer'
];

async function syncOverseasJobs() {
  console.log('🌍 开始抓取海外职位...');
  
  let total = 0;
  
  for (const country of COUNTRIES) {
    console.log(`\n📍 抓取 ${country.name} (${country.code})...`);
    
    for (const keyword of KEYWORDS) {
      for (const city of country.cities) {
        try {
          const count = await fetchAdzunaJobs(keyword, city, 1, country.code);
          total += count;
          
          console.log(`  ✅ ${keyword} in ${city}: ${count} 个`);
          
          // 频率控制
          await sleep(1500);
        } catch (error: any) {
          console.error(`  ❌ ${keyword} in ${city}:`, error.message);
        }
      }
    }
  }
  
  console.log(`\n✅ 海外职位抓取完成！总计新增 ${total} 个职位`);
  return total;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行
if (require.main === module) {
  syncOverseasJobs()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { syncOverseasJobs };
