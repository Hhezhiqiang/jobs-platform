import { prisma } from './prisma';

interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area: string[];
  };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  created: string;
}

interface AdzunaResponse {
  count: number;
  results: AdzunaJob[];
}

export async function fetchAdzunaJobs(
  keyword?: string,
  location?: string,
  page: number = 1
): Promise<number> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('Adzuna API credentials not configured');
    return 0;
  }

  const baseUrl = 'https://api.adzuna.com/v1/api/jobs/cn/search';
  const url = new URL(`${baseUrl}/${page}`);
  
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '50');
  
  if (keyword) {
    url.searchParams.set('what', keyword);
  }
  
  if (location) {
    url.searchParams.set('where', location);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // 1 小时缓存
    });

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data: AdzunaResponse = await response.json();
    
    console.log(`Adzuna: 获取到 ${data.results.length} 个职位`);

    // 保存到数据库
    const jobs = data.results.map(job => ({
      slug: `adzuna-${job.id}`,
      title: job.title,
      description: job.description,
      location: job.location.display_name,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      employmentType: job.contract_type || 'FULL_TIME',
      applyUrl: job.redirect_url,
      source: 'ADZUNA',
      sourceId: job.id,
      status: 'ACTIVE' as const,
      companyId: null,
      authorId: null
    }));

    // 批量保存（去重）
    const saved = await prisma.jobs.createMany({
      data: jobs,
      skipDuplicates: true
    });

    console.log(`Adzuna: 新增 ${saved.count} 个职位`);
    
    return saved.count;
  } catch (error: any) {
    console.error('Adzuna API error:', error.message);
    return 0;
  }
}

// 批量获取多个关键词的职位
export async function fetchAdzunaBulkJobs() {
  const keywords = [
    'frontend', 'backend', 'fullstack', 
    'java', 'python', 'javascript',
    'product manager', 'designer'
  ];
  
  const locations = [
    'Beijing', 'Shanghai', 'Shenzhen', 
    'Guangzhou', 'Hangzhou', 'Remote'
  ];

  let total = 0;

  for (const keyword of keywords) {
    for (const location of locations) {
      try {
        const count = await fetchAdzunaJobs(keyword, location, 1);
        total += count;
        
        // 频率控制
        await sleep(1000);
      } catch (error: any) {
        console.error(`Failed ${keyword} ${location}:`, error.message);
      }
    }
  }

  console.log(`Adzuna 批量获取完成：新增 ${total} 个职位`);
  return total;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
