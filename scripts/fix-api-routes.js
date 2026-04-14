const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

const REPLACEMENTS = [
  // include/exclude fields
  { re: /include:\s*\{\s*job:\s*\{/g, repl: 'include: { jobs: {' },
  { re: /include:\s*\{\s*members:\s*\{/g, repl: 'include: { company_members: {' },
  { re: /include:\s*\{\s*company:\s*\{/g, repl: 'include: { companies: {' },
  { re: /include:\s*\{\s*link:\s*\{/g, repl: 'include: { promoter_links: {' },
  { re: /include:\s*\{\s*archives:\s*\{/g, repl: 'include: { keyword_archives: {' },
  { re: /include:\s*\{\s*position:\s*\{/g, repl: 'include: { ad_positions: {' },
  
  // where clauses  
  { re: /where:\s*\{[^}]*job:\s*\{/g, repl: (m) => m.replace(/job:\s*\{/, 'jobs: {') },
  { re: /where:\s*\{[^}]*company:\s*\{/g, repl: (m) => m.replace(/company:\s*\{/, 'companies: {') },
  
  // count selects
  { re: /_count:\s*\{\s*select:\s*\{\s*applications:/g, repl: '_count: { select: { job_applications:' },
  { re: /_count:\s*\{\s*select:\s*\{\s*seoPlans:/g, repl: '_count: { select: { seo_plans:' },
  
  // Prisma client methods
  { re: /prisma\.commissionAdjustment\./g, repl: 'prisma.commission_adjustments.' },
  { re: /prisma\.commissionRecord\./g, repl: 'prisma.commission_records.' },
  { re: /tx\.commissionAdjustment\./g, repl: 'tx.commission_adjustments.' },
  { re: /tx\.commissionRecord\./g, repl: 'tx.commission_records.' },
  { re: /prisma\.promoter\./g, repl: 'prisma.promoters.' },
  { re: /tx\.promoter\./g, repl: 'tx.promoters.' },
  { re: /prisma\.promoterLink\./g, repl: 'prisma.promoter_links.' },
  { re: /tx\.promoterLink\./g, repl: 'tx.promoter_links.' },
  { re: /prisma\.withdrawalRecord\./g, repl: 'prisma.withdrawal_records.' },
  { re: /tx\.withdrawalRecord\./g, repl: 'tx.withdrawal_records.' },
  { re: /prisma\.balanceTransaction\./g, repl: 'prisma.balance_transactions.' },
  { re: /tx\.balanceTransaction\./g, repl: 'tx.balance_transactions.' },
  { re: /prisma\.contactUnlockOrder\./g, repl: 'prisma.contact_unlock_orders.' },
  { re: /tx\.contactUnlockOrder\./g, repl: 'tx.contact_unlock_orders.' },
  { re: /prisma\.userReferral\./g, repl: 'prisma.user_referrals.' },
  { re: /tx\.userReferral\./g, repl: 'tx.user_referrals.' },
  
  // result property access in API routes
  { re: /\.members\[0\]/g, repl: '.company_members[0]' },
  { re: /\.members\.length/g, repl: '.company_members.length' },
  { re: /\.members\.map/g, repl: '.company_members.map' },
  
  // Specific where clause fixes for nested job queries
  { re: /job:\s*\{\s*companyId/g, repl: 'jobs: { companyId' },
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const { re, repl } of REPLACEMENTS) {
    if (re.test(content)) {
      if (typeof repl === 'function') {
        content = content.replace(re, repl);
      } else {
        content = content.replace(re, repl);
      }
      changed = true;
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
    } else if (/\.ts$/.test(entry)) {
      replaceInFile(fullPath);
    }
  }
}

walk(SRC_DIR);
console.log('API routes fix done.');
