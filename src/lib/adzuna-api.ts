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

/**
 * 判断是否需要对职位调用 AI 解析
 * 如果职位描述已包含结构化关键词，可直接跳过 AI
 */
function needsAIParsing(description: string): boolean {
  // 如果描述很短或已经是结构化格式（包含明确的岗位职责/任职要求标记），跳过 AI
  const hasStructure = /岗位职责|任职要求|岗位要求|responsibilities|requirements|qualifications/i.test(description);
  // 非常短的描述不值得 AI 解析
  if (description.length < 200) return false;
  // 没有结构化标记的需要 AI 解析
  return !hasStructure;
}

/**
 * 批量提取城市名
 */
function extractCity(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName;
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
      const errorBody = await response.text();
      console.error(`Adzuna API error ${response.status}:`, errorBody);
      throw new Error(`Adzuna API error: ${response.status} - ${errorBody}`);
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
    const failedJobs: string[] = [];

    for (const job of data.results) {
      try {
        const fullLocation = job.location?.display_name || location || 'Remote';
        const city = extractCity(fullLocation);
        const globalTags = getRegionTags(country, fullLocation);

        if (job.category?.tag) {
          globalTags.push(job.category.tag);
        }

        let directApplyUrl = job.redirect_url;

        // 从描述中提取 URL
        const urlMatch = job.description.match(/(https?:\/\/[^\s<>"']+)/i);
        if (urlMatch && urlMatch[1] && !urlMatch[1].includes('adzuna.com')) {
          directApplyUrl = urlMatch[1];
        }

        // 成本优化：只在需要时调用 AI 解析职位描述
        let parsed = { description: '', requirements: '', benefits: '' };
        if (needsAIParsing(job.description)) {
          parsed = await parseJobDescriptionWithAI(job.description);
        } else {
          // 直接使用原始描述
          parsed.description = job.description.substring(0, 500);
        }

        await prisma.jobs.create({
          data: {
            slug: `adzuna-${job.id}`,
            title: job.title,
            description: parsed.description,
            requirements: parsed.requirements,
            benefits: parsed.benefits,
            location: fullLocation,
            city,
            country: country.toUpperCase(),
            salaryMin: job.salary_min || null,
            salaryMax: job.salary_max || null,
            employmentType: job.contract_type === 'part_time' ? 'PART_TIME' :
              job.contract_type === 'contract' ? 'CONTRACT' :
                job.contract_type === 'internship' ? 'INTERNSHIP' :
                  job.contract_type === 'freelance' ? 'FREELANCE' : 'FULL_TIME',
            applyUrl: directApplyUrl,
            status: 'ACTIVE',
            companyId,
            authorId,
            keywords: globalTags
          }
        });
        savedCount++;

        // 限流
        await sleep(2000);
      } catch (error: unknown) {
        const errMsg = (error as Error).message;
        if (!errMsg.includes('Unique constraint')) {
          console.error(`Failed to save job ${job.id}:`, errMsg);
          failedJobs.push(job.id);
        }
      }
    }

    console.log(`Adzuna: 新增 ${savedCount} 个职位, 失败 ${failedJobs.length} 个`);
    return savedCount;
  } catch (error: unknown) {
    console.error('Adzuna API error:', (error as Error).message);
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
          await sleep(2000);
        } catch (error: unknown) {
          console.error(`Failed ${keyword} ${location}:`, (error as Error).message);
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
