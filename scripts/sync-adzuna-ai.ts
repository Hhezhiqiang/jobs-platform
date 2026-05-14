/**
 * Adzuna 同步 + AI 补全职位描述
 * - 从 Adzuna 获取基础信息
 * - 用 Kimi API 生成完整岗位职责/要求/福利
 * - 控制频率避免限流
 */

import { PrismaClient } from "@prisma/client";
import { stripHtml } from "../src/lib/html-strip";
import { aiChatJSON } from "../src/lib/ai-client";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();

const JOB_TYPES = {
  'full_time': 'FULL_TIME',
  'part_time': 'PART_TIME',
  'contract': 'CONTRACT',
  'internship': 'INTERNSHIP',
  'freelance': 'FREELANCE',
} as const;

// 从 Adzuna 获取职位
async function fetchJobs(keyword: string, location: string, page: number = 1) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  
  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Adzuna API ${res.status}`);
  return res.json();
}

// AI 补全职位描述
async function enrichJobWithAI(job: any): Promise<{ description: string; requirements: string; benefits: string }> {
  const prompt = `你是一个专业的 HR 专家。根据以下职位信息，生成详细的中文职位描述。

职位：${job.title}
公司：${job.company?.display_name || '知名科技公司'}
地点：${job.location?.display_name}
薪资：${job.salary_min ? `£${job.salary_min.toLocaleString()}` : '面议'} - ${job.salary_max ? `£${job.salary_max.toLocaleString()}` : '面议'}（年薪）

请返回纯 JSON 格式（不要 Markdown 代码块），包含三个字段：
- description: 岗位职责（数组，5-8 条，每条以 - 开头）
- requirements: 任职要求（数组，5-8 条，每条以 - 开头）
- benefits: 福利待遇（数组，5-6 条，每条以 - 开头）

要求内容专业、详细、符合科技行业标准，总字数不少于 500 字。`;

  try {
    // 先获取文本内容
    const content = await aiChatJSON<{ description: string[]; requirements: string[]; benefits: string[] }>([
      { role: "system", content: "你是一个专业的 HR 专家，擅长撰写职位描述。请返回纯 JSON 格式。" },
      { role: "user", content: prompt }
    ], { maxTokens: 3000, maxRetries: 2 });
    
    // 将数组转换为 Markdown 字符串
    return {
      description: content.description.map((d: string) => `- ${d}`).join('\n'),
      requirements: content.requirements.map((r: string) => `- ${r}`).join('\n'),
      benefits: content.benefits.map((b: string) => `- ${b}`).join('\n')
    };
  } catch (error) {
    logger.error('AI 补全失败:', (error as Error).message);
    // 降级：使用原始描述
    const cleanDesc = stripHtml(job.description || '');
    return {
      description: cleanDesc || '暂无描述',
      requirements: '请参考岗位职责和面试沟通',
      benefits: '请参考公司官网了解福利详情'
    };
  }
}

// 检查公司是否存在，不存在则创建
async function getOrCreateCompany(companyName: string, location: string) {
  let company = await prisma.companies.findFirst({
    where: { name: companyName }
  });
  
  if (!company && companyName) {
    company = await prisma.companies.create({
      data: {
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
        industry: 'Technology',
        location: location,
        verificationStatus: 'APPROVED',
      }
    });
  }
  
  return company;
}

async function main() {
  console.log('[sync-adzuna-ai] Starting AI-enriched sync...');
  
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const companyId = process.env.ADZUNA_COMPANY_ID;
  const authorId = process.env.ADZUNA_AUTHOR_ID;
  
  if (!appId || !appKey || !companyId || !authorId) {
    console.log('ERROR: Missing credentials');
    return;
  }
  
  const keywords = ['software engineer', 'frontend developer', 'backend developer'];
  const locations = ['London', 'Manchester'];
  
  let totalProcessed = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  let aiCalls = 0;
  
  for (const keyword of keywords) {
    for (const location of locations) {
      console.log(`\nFetching: ${keyword} @ ${location}`);
      
      try {
        const data = await fetchJobs(keyword, location, 1);
        const jobs = data.results || [];
        console.log(`  Got ${jobs.length} jobs`);
        
        for (const job of jobs.slice(0, 10)) { // 每个地点只处理前 10 个
          totalProcessed++;
          
          // 检查是否已存在
          const existingJob = await prisma.jobs.findFirst({
            where: { 
              slug: { contains: job.id }
            }
          });
          
          if (existingJob) {
            totalSkipped++;
            continue;
          }
          
          // 获取或创建公司
          const company = await getOrCreateCompany(
            job.company?.display_name || 'Unknown',
            location
          );
          
          if (!company) continue;
          
          // AI 补全描述
          console.log(`  AI enriching: ${job.title}`);
          const enriched = await enrichJobWithAI(job);
          aiCalls++;
          
          // 等待一下避免 AI 限流
          if (aiCalls % 3 === 0) {
            console.log('  Waiting to avoid rate limit...');
            await new Promise(r => setTimeout(r, 5000));
          }
          
          // 计算月薪 K（Adzuna 返回年薪）
          const salaryMin = job.salary_min ? Math.round(job.salary_min / 12 / 1000) : null;
          const salaryMax = job.salary_max ? Math.round(job.salary_max / 12 / 1000) : null;
          
          // 创建职位
          await prisma.jobs.create({
            data: {
              slug: `adzuna-${job.id}`,
              title: job.title,
              description: enriched.description,
              requirements: enriched.requirements,
              benefits: enriched.benefits,
              employmentType: JOB_TYPES[job.contract_type as keyof typeof JOB_TYPES] || 'FULL_TIME',
              experience: 'MID',
              salaryMin,
              salaryMax,
              salaryCurrency: 'GBP',
              salaryPeriod: 'MONTH',
              location: job.location?.display_name || location,
              city: location,
              country: 'GB',
              isRemote: job.location?.area?.includes('Remote') || false,
              applyUrl: job.redirect_url || '',
              status: 'ACTIVE',
              companyId: company.id,
              authorId: authorId,
            }
          });
          
          totalCreated++;
          console.log(`  ✓ Created: ${job.title}`);
        }
      } catch (error) {
        console.error(`  Error:`, (error as Error).message);
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${totalProcessed}`);
  console.log(`Created: ${totalCreated}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`AI calls: ${aiCalls}`);
  
  const totalJobs = await prisma.jobs.count();
  console.log(`Total jobs in DB: ${totalJobs}`);
}

main().catch(e => { logger.error('Fatal:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
