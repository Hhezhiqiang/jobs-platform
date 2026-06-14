#!/bin/bash
# ============================================================
# 导入 2,029 个 Web3 岗位到 jobquip.com 数据库
# 来源: Greenhouse + Ashby + Lever + RemoteOK
# ============================================================
set -e
export HOME=/root
cd /opt/jobs-platform

echo "========================================="
echo "  Web3 Jobs Importer"
echo "========================================="

# Download data
echo "[1/3] Downloading job data..."
curl -sL -o /tmp/all-jobs.json https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/data/all-jobs.json
SIZE=$(wc -c < /tmp/all-jobs.json)
echo "  Downloaded $SIZE bytes"

# Create Node.js importer
echo "[2/3] Creating import script..."
cat > /tmp/import-all.mjs << 'IMPORTJS'
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const jobs = JSON.parse(readFileSync("/tmp/all-jobs.json", "utf-8"));
console.log(`Total jobs to import: ${jobs.length}`);

const ADMIN_ID = "aaa2604d-96d5-431d-b4a8-cb7e5455e103";
const companyMap = new Map();
let created = 0, skipped = 0, companyCount = 0;

// Pre-load existing companies
const existingCompanies = await prisma.companies.findMany({ select: { id: true, slug: true, name: true } });
for (const c of existingCompanies) { companyMap.set(c.slug, c.id); companyMap.set(c.name.toLowerCase(), c.id); }
console.log(`  Pre-loaded ${existingCompanies.length} existing companies`);

for (const job of jobs) {
  try {
    // Normalize company name
    const companyName = job.company;
    const companyKey = companyName.toLowerCase();
    let companyId = companyMap.get(companyKey);

    if (!companyId) {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").substring(0,50);
      try {
        const nc = await prisma.companies.create({
          data: { name: companyName, slug, industry: "Technology/Web3", size: "100-500", location: job.country||"Global", verificationStatus: "APPROVED" }
        });
        companyMap.set(companyKey, nc.id);
        companyId = nc.id;
        companyCount++;
      } catch (e) {
        if (e.code === "P2002") {
          const existing = await prisma.companies.findUnique({ where: { slug } });
          if (existing) { companyMap.set(companyKey, existing.id); companyId = existing.id; }
        } else { throw e; }
      }
    }

    const desc = (job.description||"").substring(0, 2000);
    const titleSlug = (job.title||"").replace(/[^a-zA-Z0-9\s-]/g,"").replace(/\s+/g,"-").toLowerCase().substring(0,50);
    const slug = `${titleSlug}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const location = (job.location||"").substring(0, 100);
    const cityStr = (job.city||"").substring(0, 100);
    const countryStr = (job.country||"US").substring(0, 10);

    await prisma.jobs.create({
      data: {
        title: job.title, titleEn: job.title,
        description: desc, descriptionEn: desc,
        slug, employmentType: "FULL_TIME", experience: "MID",
        salaryCurrency: "USD", salaryPeriod: "YEAR",
        location, city: cityStr, country: countryStr,
        isRemote: job.isRemote||false, isHybrid: false,
        applyUrl: job.applyUrl||"", status: "ACTIVE", isFeatured: false,
        keywords: ["web3","blockchain","crypto"],
        companyId, authorId: ADMIN_ID,
      }
    });
    created++;
    if (created % 200 === 0) console.log(`  Progress: ${created}/${jobs.length} (companies: ${companyCount})`);
  } catch (e) {
    if (e.code === "P2002") { skipped++; }
    else { console.error(`  Skip [${job.company}] ${job.title}: ${e.code}`); skipped++; }
  }
}

console.log(`\n=== IMPORT COMPLETE ===`);
console.log(`Jobs created: ${created}`);
console.log(`Skipped: ${skipped}`);
console.log(`Companies created: ${companyCount}`);
await prisma.$disconnect();
IMPORTJS

# Run import
echo "[3/3] Running import..."
node /tmp/import-all.mjs 2>&1
echo ""
echo "=== DONE ==="