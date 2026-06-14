#!/bin/bash
# Import Greenhouse jobs to jobquip.com database
# Run on server: bash /tmp/import-gh.sh

set -e
export HOME=/root
cd /opt/jobs-platform

echo "=== Downloading job data ==="
curl -sL -o /tmp/gh-jobs.json https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/data/gh-jobs.json
echo "  Downloaded $(wc -c < /tmp/gh-jobs.json) bytes"

echo "=== Importing via Node.js ==="
cat > /tmp/import-gh.mjs << 'IMPORTEOF'
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const jobs = JSON.parse(readFileSync("/tmp/gh-jobs.json", "utf-8"));

console.log(`Total jobs to import: ${jobs.length}`);

const ADMIN_ID = "aaa2604d-96d5-431d-b4a8-cb7e5455e103";
const companyCache = new Map();

let created = 0, skipped = 0, companyCreated = 0;

for (const job of jobs) {
  try {
    // Ensure company exists
    let companySlug = job.company.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    if (!companyCache.has(companySlug)) {
      const existing = await prisma.companies.findUnique({ where: { slug: companySlug } });
      if (existing) {
        companyCache.set(companySlug, existing.id);
      } else {
        const newCompany = await prisma.companies.create({
          data: {
            name: job.company,
            slug: companySlug,
            industry: "Technology/Web3",
            size: "100-500",
            location: job.country || "Global",
            verificationStatus: "APPROVED",
          }
        });
        companyCache.set(companySlug, newCompany.id);
        companyCreated++;
      }
    }

    const companyId = companyCache.get(companySlug);

    // Generate unique slug
    const titleSlug = job.title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .substring(0, 60);
    const slug = `${titleSlug}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

    // Insert job
    await prisma.jobs.create({
      data: {
        title: job.title,
        titleEn: job.title,
        description: job.description || "",
        descriptionEn: job.description || "",
        slug,
        employmentType: "FULL_TIME",
        experience: "MID",
        salaryCurrency: "USD",
        salaryPeriod: "YEAR",
        location: job.location || "",
        city: job.city || "",
        country: job.country || "US",
        isRemote: job.isRemote || false,
        isHybrid: job.isHybrid || false,
        applyUrl: job.applyUrl || "",
        status: "ACTIVE",
        isFeatured: false,
        keywords: ["web3", "blockchain", "crypto"],
        companyId,
        authorId: ADMIN_ID,
      }
    });
    created++;
    if (created % 100 === 0) console.log(`  Progress: ${created}/${jobs.length}`);
  } catch (e) {
    if (e.code === "P2002") { skipped++; continue; }
    console.error(`  Error [${job.company} - ${job.title}]: ${e.message}`);
  }
}

console.log(`\n=== Import Complete ===`);
console.log(`Created: ${created}`);
console.log(`Skipped (duplicates): ${skipped}`);
console.log(`Companies created: ${companyCreated}`);
await prisma.$disconnect();
IMPORTEOF

echo "=== Running import ==="
node /tmp/import-gh.mjs 2>&1
echo "=== Import finished ==="