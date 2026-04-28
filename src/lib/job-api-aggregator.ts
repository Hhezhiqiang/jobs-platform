import { prisma } from './prisma';

// ============ Jooble API ============

interface JoobleJob {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  salary?: string;
  date?: string;
}

export async function fetchJoobleJobs(
  keyword?: string,
  location?: string,
  page: number = 1
): Promise<number> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.warn('Jooble API key not configured');
    return 0;
  }

  const baseUrl = 'https://jooble.org/api/';
  
  try {
    const response = await fetch(`${baseUrl}${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: keyword || 'developer',
        location: location || 'Remote',
        page: page
      })
    });

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: JoobleJob[] = data.jobs || [];
    
    console.log(`Jooble: 获取到 ${jobs.length} 个职位`);

    // 保存职位
    let savedCount = 0;
    const companyId = process.env.JOOBLE_COMPANY_ID || '';
    const authorId = process.env.JOOBLE_AUTHOR_ID || '';
    
    if (!companyId || !authorId) {
      console.warn('⚠️ Jooble: 未配置公司/作者 ID，跳过保存');
      return jobs.length; // 返回抓取数量但不保存
    }
    
    for (const job of jobs) {
      try {
        await prisma.jobs.create({
          data: {
            slug: `jooble-${job.id}`,
            title: job.title,
            description: job.description || '',
            location: job.location,
            applyUrl: job.link,
            status: 'ACTIVE',
            companyId,
            authorId
          }
        });
        savedCount++;
      } catch (error: any) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`Failed to save Jooble job ${job.id}:`, error.message);
        }
      }
    }

    console.log(`Jooble: 新增 ${savedCount} 个职位`);
    return savedCount;
  } catch (error: any) {
    console.error('Jooble API error:', error.message);
    return 0;
  }
}

// ============ The Muse API ============

interface MuseJob {
  id: number;
  job_title: string;
  company: {
    name: string;
    display_name: string;
  };
  locations: Array<{ name: string }>;
  description: string;
  refs: {
    landing: string;
  };
}

export async function fetchMuseJobs(
  keyword?: string,
  location?: string,
  page: number = 1
): Promise<number> {
  const apiKey = process.env.MUSE_API_KEY;
  if (!apiKey) {
    console.warn('The Muse API key not configured');
    return 0;
  }

  const baseUrl = 'https://www.themuse.com/api/public/jobs';
  const url = new URL(baseUrl);
  
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', '50');
  
  if (keyword) {
    url.searchParams.set('keywords', keyword);
  }
  
  if (location) {
    url.searchParams.set('location', location);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Muse API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: MuseJob[] = data.results || [];
    
    console.log(`The Muse: 获取到 ${jobs.length} 个职位`);

    // 保存职位
    let savedCount = 0;
    const companyId = process.env.MUSE_COMPANY_ID || '';
    const authorId = process.env.MUSE_AUTHOR_ID || '';
    
    if (!companyId || !authorId) {
      console.warn('⚠️ Muse: 未配置公司/作者 ID，跳过保存');
      return jobs.length;
    }
    
    for (const job of jobs) {
      try {
        await prisma.jobs.create({
          data: {
            slug: `muse-${job.id}`,
            title: job.job_title,
            description: job.description || '',
            location: job.locations?.[0]?.name || 'Remote',
            applyUrl: job.refs?.landing || '',
            status: 'ACTIVE',
            companyId,
            authorId
          }
        });
        savedCount++;
      } catch (error: any) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`Failed to save Muse job ${job.id}:`, error.message);
        }
      }
    }

    console.log(`The Muse: 新增 ${savedCount} 个职位`);
    return savedCount;
  } catch (error: any) {
    console.error('The Muse API error:', error.message);
    return 0;
  }
}

// ============ 批量同步 ============

export async function syncAllJobs() {
  console.log('🚀 开始批量同步职位...');
  
  const keywords = ['developer', 'engineer', 'designer', 'product', 'frontend', 'backend'];
  const locations = ['Beijing', 'Shanghai', 'Shenzhen', 'Remote', 'Global'];
  
  let total = 0;

  // Jooble
  console.log('\n📊 同步 Jooble...');
  for (const keyword of keywords) {
    for (const location of locations) {
      try {
        const count = await fetchJoobleJobs(keyword, location, 1);
        total += count;
        await sleep(1500); // 频率控制
      } catch (error: any) {
        console.error(`Jooble ${keyword} ${location} failed:`, error.message);
      }
    }
  }

  // The Muse
  console.log('\n📊 同步 The Muse...');
  for (const keyword of keywords) {
    for (const location of locations) {
      try {
        const count = await fetchMuseJobs(keyword, location, 1);
        total += count;
        await sleep(1500);
      } catch (error: any) {
        console.error(`Muse ${keyword} ${location} failed:`, error.message);
      }
    }
  }

  console.log(`\n✅ 批量同步完成！总计新增 ${total} 个职位`);
  return total;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
