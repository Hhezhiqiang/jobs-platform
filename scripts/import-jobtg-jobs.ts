/**
 * 从 jobtg.ai 抓取的招聘数据导入到 jobs-platform 数据库
 * 用法: npx tsx scripts/import-jobtg-jobs.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const AUTHOR_ID = 'cmnsriy4g0000xze1onsp8noo'; // 管理员用户 ID

// 数据文件路径
const DATA_FILE = '/tmp/jobtg_full_data.json';

interface ScrapedJob {
  url: string;
  id: string;
  title: string;
  salary: string;
  location: string;
  experience: string;
  education: string;
  remote: boolean;
  description: string;
  requirements: string;
  company_info: string;
  company_size: string;
  hr: string;
  benefits: string;
  updated: string;
}

// 薪资解析
function parseSalary(salaryStr: string): { min: number | null; max: number | null; currency: string } {
  const match = salaryStr.match(/(\d+)-(\d+)K/);
  if (match) {
    return {
      min: parseInt(match[1]) * 1000,
      max: parseInt(match[2]) * 1000,
      currency: 'CNY',
    };
  }
  return { min: null, max: null, currency: 'CNY' };
}

// 经验级别映射
function mapExperience(exp: string): string {
  if (!exp || exp === '经验不限') return 'ENTRY';
  if (exp.includes('1-3')) return 'ENTRY';
  if (exp.includes('3-5')) return 'MID';
  if (exp.includes('6-8')) return 'SENIOR';
  if (exp.includes('8')) return 'EXECUTIVE';
  return 'MID';
}

// 城市提取
function extractCity(location: string): string | null {
  const match = location.match(/([\u4e00-\u9fa5]+)市/);
  return match ? match[1] : null;
}

// 国家映射
function mapCountry(location: string): string {
  if (location.includes('中国大陆') || location.includes('大陆')) return 'CN';
  if (location.includes('日本')) return 'JP';
  if (location.includes('菲律宾')) return 'PH';
  if (location.includes('斯里兰卡')) return 'LK';
  if (location.includes('台湾')) return 'TW';
  if (location.includes('新加坡')) return 'SG';
  if (location.includes('马来西亚')) return 'MY';
  if (location.includes('迪拜')) return 'AE';
  return 'CN';
}

// 生成 slug
function generateSlug(title: string, id: string): string {
  return `jobtg-${id}-${title.replace(/[^\w\u4e00-\u9fff]/g, '').slice(0, 20)}-${Date.now()}`;
}

async function main() {
  console.log('=== 开始导入 jobtg.ai 招聘数据 ===\n');

  // 读取数据
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const jobs: ScrapedJob[] = JSON.parse(rawData);
  console.log(`读取到 ${jobs.length} 个职位\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const scraped of jobs) {
    try {
      console.log(`\n处理: ${scraped.title}`);

      // 1. 查找或创建公司
      const companyName = scraped.company_info.slice(0, 50) || scraped.hr || '未知公司';
      const companySlug = companyName.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase().slice(0, 50);

      let company = await prisma.companies.findUnique({
        where: { slug: `jobtg-${companySlug}` },
      });

      if (!company) {
        company = await prisma.companies.create({
          data: {
            name: companyName,
            slug: `jobtg-${companySlug}`,
            description: scraped.company_info.slice(0, 500),
            size: scraped.company_size || null,
            location: scraped.location,
            website: `https://www.jobtg.ai`,
            verificationStatus: 'APPROVED',
          },
        });
        console.log(`  ✅ 创建公司: ${company.name}`);
      } else {
        console.log(`  📌 使用已有公司: ${company.name}`);
      }

      // 2. 解析数据
      const { min: salaryMin, max: salaryMax, currency } = parseSalary(scraped.salary);
      const city = extractCity(scraped.location);
      const country = mapCountry(scraped.location);

      // 3. 创建职位
      const slug = generateSlug(scraped.title, scraped.id);
      const fullDescription = [
        scraped.description || '',
        scraped.requirements ? `\n\n任职要求：\n${scraped.requirements}` : '',
      ].filter(Boolean).join('\n').trim();

      await prisma.jobs.create({
        data: {
          slug,
          title: scraped.title,
          description: fullDescription.slice(0, 5000),
          requirements: scraped.requirements?.slice(0, 2000) || null,
          benefits: scraped.benefits || null,
          employmentType: 'FULL_TIME',
          experience: mapExperience(scraped.experience) as any,
          salaryMin,
          salaryMax,
          salaryCurrency: currency,
          salaryPeriod: 'MONTH',
          location: scraped.location || '远程',
          city,
          country,
          isRemote: scraped.remote,
          isHybrid: false,
          applyUrl: scraped.url,
          status: 'ACTIVE',
          isFeatured: scraped.remote, // 远程职位标记为特色
          viewCount: 0,
          datePosted: new Date(),
          validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天有效
          metaTitle: `${scraped.title} - ${scraped.salary} - ${scraped.location}`,
          metaDescription: `${scraped.title}，${scraped.location}，${scraped.salary}${scraped.remote ? '，可远程' : ''}`,
          keywords: [
            scraped.title,
            scraped.location,
            ...(scraped.benefits ? scraped.benefits.split(', ') : []),
            scraped.remote ? '远程' : '',
          ].filter(Boolean),
          companyId: company.id,
          authorId: AUTHOR_ID,
          descriptionEn: null,
          requirementsEn: null,
          metaDescriptionEn: null,
          metaTitleEn: null,
          benefitsEn: null,
          titleEn: null,
        },
      });

      console.log(`  ✅ 创建职位: ${scraped.title} | ${scraped.salary} | ${scraped.location}`);
      created++;

      // 避免数据库压力
      await new Promise(r => setTimeout(r, 500));

    } catch (err: any) {
      if (err.code === 'P2002') {
        console.log(`  ⏭️ 跳过重复职位: ${scraped.title}`);
        skipped++;
      } else {
        console.log(`  ❌ 错误: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
 console.log(`✅ 导入完成！`);
  console.log(`   成功: ${created}`);
  console.log(`   跳过: ${skipped}`);
  console.log(`   错误: ${errors}`);
  console.log(`   总计: ${jobs.length}`);
}

main()
  .catch((err) => {
    console.error('导入失败:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
