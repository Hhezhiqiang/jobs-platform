/**
 * Adzuna 简化版同步 - 只抓 1 个关键词 × 2 个地点
 * 用于测试流程是否正常
 */

import { PrismaClient } from "@prisma/client";
import { stripHtml, truncateText } from "../src/lib/html-strip";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();

async function fetchJobs(keyword: string, location: string) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  
  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
  
  console.log(`Fetching: ${keyword} @ ${location}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log("[sync-simple] Starting...");
  
  const companyId = process.env.ADZUNA_COMPANY_ID;
  const authorId = process.env.ADZUNA_AUTHOR_ID;
  
  if (!companyId || !authorId) {
    console.log("ERROR: Missing company/author ID");
    return;
  }
  
  let totalJobs = 0;
  let newCompanies = 0;
  let newJobs = 0;
  
  // 只抓 1 个关键词 × 2 个地点
  for (const loc of ['London', 'Manchester']) {
    try {
      const data = await fetchJobs('software engineer', loc);
      const jobs = data.results || [];
      totalJobs += jobs.length;
      console.log(`  Got ${jobs.length} jobs from ${loc}`);
      
      for (const job of jobs.slice(0, 10)) { // 每个地点只处理前 10 个
        // Check/create company
        let company = await prisma.companies.findFirst({
          where: { name: job.company?.display_name }
        });
        
        if (!company) {
          company = await prisma.companies.create({
            data: {
              name: job.company?.display_name || 'Unknown',
              slug: (job.company?.display_name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
              industry: 'Tech',
              location: loc,
              verificationStatus: 'APPROVED',
            }
          });
          newCompanies++;
        }
        
        // Check if job exists
        const existingJob = await prisma.jobs.findFirst({
          where: { 
            slug: { contains: job.id }
          }
        });
        
        if (!existingJob) {
          const cleanDesc = stripHtml(job.description);
          await prisma.jobs.create({
            data: {
              slug: `adzuna-${job.id}`,
              title: job.title,
              description: truncateText(cleanDesc, 500),
              requirements: '',
              benefits: '',
              employmentType: 'FULL_TIME',
              experience: 'MID',
              salaryMin: job.salary_min ? Math.round(job.salary_min / 12) : null,
              salaryMax: job.salary_max ? Math.round(job.salary_max / 12) : null,
              salaryCurrency: 'GBP',
              salaryPeriod: 'YEAR',
              location: job.location?.display_name || '',
              city: loc,
              country: 'GB',
              isRemote: job.location?.area?.includes('Remote') || false,
              applyUrl: job.redirect_url || '',
              status: 'ACTIVE',
              companyId: company.id,
              authorId: authorId,
            }
          });
          newJobs++;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${loc}:`, (error as Error).message);
    }
  }
  
  console.log(`\nTotal: ${totalJobs} fetched, ${newCompanies} new companies, ${newJobs} new jobs`);
  
  const totalJobsInDb = await prisma.jobs.count();
  console.log(`Total jobs in DB: ${totalJobsInDb}`);
}

main().catch(e => { logger.error('Fatal:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
