/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// 定义替换规则：[正则模式, 替换为]
const RULES = [
  // 1. include 关系字段
  { re: /include:\s*\{[\s\S]*?\bjob\b:/g, repl: (m) => m.replace(/\bjob\b:/, 'jobs:') }, // 这个只匹配第一个 job: 在 include 块中，不精确
];

// 更安全的做法：字符串直接替换（只在代码行中）
const STRING_RULES = [
  // Prisma 查询关系字段
  ['include: { promoter: true', 'include: { promoters: true'],
  ['include: { promoter:', 'include: { promoters:'],
  ['include: { members:', 'include: { company_members:'],
  ['include: { position:', 'include: { ad_positions:'],
  ['include: { archives:', 'include: { keyword_archives:'],
  ['include: { monitor:', 'include: { keyword_monitors:'],
  ['include: { job:', 'include: { jobs:'],
  ['include: { company:', 'include: { companies:'],
  ['include: { user:', 'include: { users:'],
  ['select: { job:', 'select: { jobs:'],
  ['select: { company:', 'select: { companies:'],
  ['where: { job:', 'where: { jobs:'],
  ['where: { company:', 'where: { companies:'],
  ['orderBy: { applications:', 'orderBy: { job_applications:'],
  ['_count: { applications:', '_count: { job_applications:'],
  ['_count: { seoPlans:', '_count: { seo_plans:'],
  
  // 结果属性访问
  ['app.job?.', 'app.jobs?.'],
  ['app.job.', 'app.jobs.'],
  ['app.job.slug', 'app.jobs.slug'],
  ['app.job.companies', 'app.jobs.companies'],
  ['app.job.title', 'app.jobs.title'],
  ['app.job.id', 'app.jobs.id'],
  ['record.job.', 'record.jobs.'],
  ['record.job?.', 'record.jobs?.'],
  ['application.job.', 'application.jobs.'],
  ['application.job?.', 'application.jobs?.'],
  ['withdrawal.promoter.', 'withdrawal.promoters.'],
  ['withdrawal.promoter?.', 'withdrawal.promoters?.'],
  ['commission.promoter.', 'commission.promoters.'],
  ['commission.promoter?.', 'commission.promoters?.'],
  ['._count.applications', '._count.job_applications'],
  ['j._count.applications', 'j._count.job_applications'],
  ['job._count.applications', 'job._count.job_applications'],
  ['companies._count.applications', 'companies._count.job_applications'],
  
  // 一些特定变量名
  ['app.job &&', 'app.jobs &&'],
  ['app.job)', 'app.jobs)'],
  ['job.companies?.', 'job.companies?.'], // 已经是 companies，不变
  ['job.companies.', 'job.companies.'],
  
  // Dashboard / Analytics 中的 company
  ['_count: { select: { applications:', '_count: { select: { job_applications:'],
  ['company: { select:', 'companies: { select:'],
  ['applications: { _count:', 'job_applications: { _count:'],
  
  // users page
  ['_count: { applications: true }', '_count: { job_applications: true }'],
  
  // salary-insights
  ['Prisma.JobWhereInput', 'Prisma.jobsWhereInput'],
  
  // Enum filter
  ['EnumApplicationStatusFilter<"JobApplication">', 'EnumApplicationStatusFilter<"job_applications">'],
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [oldStr, newStr] of STRING_RULES) {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      replaceInFile(fullPath);
    }
  }
}

walk(SRC_DIR);
console.log('Batch replacement done.');
