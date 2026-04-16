/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

const STRING_RULES = [
  // Imports
  ['import { Job, Company } from "@prisma/client";', 'import { jobs, companies } from "@prisma/client";'],
  ['import { Job, Company, JobApplication } from "@prisma/client";', 'import { jobs, companies, job_applications } from "@prisma/client";'],
  ['import { JobApplication } from "@prisma/client";', 'import { job_applications } from "@prisma/client";'],
  ['import { Job } from "@prisma/client";', 'import { jobs } from "@prisma/client";'],
  ['import { Company } from "@prisma/client";', 'import { companies } from "@prisma/client";'],

  // Enum type params
  ['EnumApplicationStatusFilter<"JobApplication">', 'EnumApplicationStatusFilter<"job_applications">'],
  ['EnumEmploymentTypeFilter<"Job">', 'EnumEmploymentTypeFilter<"jobs">'],
  
  // Custom interface intersections - change company -> companies in type defs
  ['job: Job \u0026 { company: Company }', 'job: jobs \u0026 { companies: companies }'],
  ['JobWithCompany extends Job {\n  company: Company;', 'JobWithCompany extends jobs {\n  companies: companies;'],
  ['JobWithCompany extends jobs {\n  company: companies;', 'JobWithCompany extends jobs {\n  companies: companies;'],
  ['RecommendedJob extends Job {\n  company: Company;', 'RecommendedJob extends jobs {\n  companies: companies;'],
  ['RecommendedJob extends jobs {\n  company: companies;', 'RecommendedJob extends jobs {\n  companies: companies;'],
  
  ['type JobWithCompany = Job \u0026 { company: Company }', 'type JobWithCompany = jobs \u0026 { companies: companies }'],
  ['type JobWithCompany = jobs \u0026 { company: companies }', 'type JobWithCompany = jobs \u0026 { companies: companies }'],
  
  // Component props
  ['job: Job \u0026 { company: Company }', 'job: jobs \u0026 { companies: companies }'],
  ['job: jobs \u0026 { company: companies }', 'job: jobs \u0026 { companies: companies }'],
  
  // Schema/Metadata function params  
  ['job: Job \u0026 { company: Company }', 'job: jobs \u0026 { companies: companies }'],
  ['company: Company)', 'company: companies)'],
  
  // API interfaces
  ['interface JobWithCompany extends Job {\n  company: Company;', 'interface JobWithCompany extends jobs {\n  companies: companies;'],
  ['interface JobWithCompany extends jobs {\n  company: companies;', 'interface JobWithCompany extends jobs {\n  companies: companies;'],
];

const REGEX_RULES = [
  // Fix .company. -> .companies. when accessing job's company (but not in Prisma where clauses)
  // We need to be careful here. Let's do it for common patterns after job/record variables
  { re: /\bjob\.company\b/g, repl: 'job.companies' },
  { re: /\brecord\.company\b/g, repl: 'record.companies' },
  { re: /\bapplication\.company\b/g, repl: 'application.companies' },
  { re: /\bitem\.company\b/g, repl: 'item.companies' },
  { re: /\bj\.company\b/g, repl: 'j.companies' },
  
  // Fix .job. -> .jobs. for application records
  { re: /\bapp\.job\b/g, repl: 'app.jobs' },
  { re: /\brecord\.job\b/g, repl: 'record.jobs' },
  { re: /\bapplication\.job\b/g, repl: 'application.jobs' },
  
  // Fix withdrawal.promoter -> withdrawal.promoters
  { re: /\bwithdrawal\.promoter\b/g, repl: 'withdrawal.promoters' },
  { re: /\bcommission\.promoter\b/g, repl: 'commission.promoters' },
  
  // Fix promoter.link -> promoter.promoter_links ? No, let's check schema
  // Actually promoter_links model exists. In results it's probably promoter_links
  
  // Fix result monitor access -> keyword_monitors
  { re: /\bresult\.monitor\b/g, repl: 'result.keyword_monitors' },
  { re: /\bplan\.monitor\b/g, repl: 'plan.keyword_monitors' },
  
  // Fix archive access
  { re: /\bmonitor\.archives\b/g, repl: 'monitor.keyword_archives' },
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
  
  for (const { re, repl } of REGEX_RULES) {
    if (re.test(content)) {
      content = content.replace(re, repl);
      changed = true;
      // reset lastIndex for global regex
      re.lastIndex = 0;
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
