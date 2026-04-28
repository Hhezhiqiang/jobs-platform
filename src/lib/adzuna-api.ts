import { prisma } from './prisma';
import { parseJobDescriptionWithAI } from './parse-job-description';
import { getRegionTags } from './global-job-tags';

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
  category?: {
    label: string;
    tag: string;
  };
}

interface AdzunaResponse {
  count: number;
  results: AdzunaJob[];
}

export async function fetchAdzunaJobs(
  keyword?: string,
  location?: string,
  page: number = 1,
  country: string = 'gb'
): Promise<number> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('Adzuna API credentials not configured');
    return 0;
  }

  const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search`;
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
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data: AdzunaResponse = await response.json();
    
    console.log(`Adzuna (${country}): 获取到 ${data.results.length} 个职位`);

    const companyId = process.env.ADZUNA_COMPANY_ID || '';
    const authorId = process.env.ADZUNA_AUTHOR_ID || '';
    
    if (!companyId || !authorId) {
      console.error('未配置公司/作者 ID');
      return 0;
    }

    let savedCount = 0;
    for (const job of data.results) {
      try {
        // 使用 AI 解析职位描述
        const parsed = await parseJobDescriptionWithAI(job.description);
        
        // 提取城市名
        const fullLocation = job.location?.display_name || location || 'Remote';
        const city = fullLocation.split(',')[0]?.trim() || fullLocation;
        
        // 自动生成全球标签
        const globalTags = getRegionTags(country, fullLocation);
        
        // 添加行业分类标签
        if (job.category?.tag) {
          globalTags.push(job.category.tag);
        }
        
        // 尝试提取原始招聘网站链接
        // Adzuna 的 redirect_url 是跳转链接，我们尝试从描述中提取原始链接
        let directApplyUrl = job.redirect_url;
        
        // 从描述中提取 URL（如果有）
        const urlMatch = job.description.match(/(https?:\/\/[^\s<>"']+)/i);
        if (urlMatch && urlMatch[1]) {
          // 排除 Adzuna 自己的链接
          if (!urlMatch[1].includes('adzuna.com')) {
            directApplyUrl = urlMatch[1];
          }
        }
        
        await prisma.jobs.create({
          data: {
            slug: `adzuna-${job.id}`,
            title: job.title,
            description: parsed.description, // 岗位职责
            requirements: parsed.requirements, // 任职要求
            benefits: parsed.benefits, // 福利待遇
            location: fullLocation,
            city: city,
            country: country.toUpperCase(),
            salaryMin: job.salary_min || null,
            salaryMax: job.salary_max || null,
            employmentType: job.contract_type === 'part_time' ? 'PART_TIME' : 
                           job.contract_type === 'contract' ? 'CONTRACT' : 
                           job.contract_type === 'internship' ? 'INTERNSHIP' : 
                           job.contract_type === 'freelance' ? 'FREELANCE' : 'FULL_TIME',
            applyUrl: directApplyUrl, // 使用直接链接
            status: 'ACTIVE',
            companyId,
            authorId,
            keywords: globalTags // 自动添加全球标签
          }
        });
        savedCount++;
        
        // 频率控制（AI API 限制）
        await sleep(500);
      } catch (error: any) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`Failed to save job ${job.id}:`, error.message);
        }
      }
    }

    console.log(`Adzuna: 新增 ${savedCount} 个职位`);
    return savedCount;
  } catch (error: any) {
    console.error('Adzuna API error:', error.message);
    return 0;
  }
}

// 批量获取
export async function fetchAdzunaBulkJobs() {
  const keywords = ['software engineer', 'developer', 'engineer'];
  const locations = ['London', 'Manchester', 'Birmingham'];
  const countries = ['gb'];

  let total = 0;

  for (const country of countries) {
    for (const keyword of keywords) {
      for (const location of locations) {
        try {
          const count = await fetchAdzunaJobs(keyword, location, 1, country);
          total += count;
          await sleep(2000); // 频率控制
        } catch (error: any) {
          console.error(`Failed ${keyword} ${location}:`, error.message);
        }
      }
    }
  }

  console.log(`批量获取完成：新增 ${total} 个职位`);
  return total;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
