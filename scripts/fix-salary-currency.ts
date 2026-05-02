import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load production env variables
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting salary currency fix...');

  // 1. Fix UK jobs (GBP)
  // Identify jobs by country code 'GB' or common UK keywords in location
  const ukKeywords = ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'UK', 'United Kingdom', 'Scotland', 'England'];
  
  const ukJobs = await prisma.jobs.findMany({
    where: {
      OR: [
        { country: 'GB' },
        { country: 'UK' },
        { location: { contains: 'London', mode: 'insensitive' } },
        { location: { contains: 'Manchester', mode: 'insensitive' } },
        { location: { contains: 'Birmingham', mode: 'insensitive' } },
        { location: { contains: 'Liverpool', mode: 'insensitive' } },
        { location: { contains: 'Leeds', mode: 'insensitive' } },
        { location: { contains: 'UK', mode: 'insensitive' } },
      ]
    }
  });

  console.log(`🇬🇧 Found ${ukJobs.length} UK jobs to update.`);

  const batchSize = 100;
  let updatedUkCount = 0;

  for (let i = 0; i < ukJobs.length; i += batchSize) {
    const batch = ukJobs.slice(i, i + batchSize);
    const ids = batch.map(job => job.id);
    
    await prisma.jobs.updateMany({
      where: { id: { in: ids } },
      data: { salaryCurrency: 'GBP' }
    });
    
    updatedUkCount += ids.length;
  }

  console.log(`✅ Updated ${updatedUkCount} UK jobs to GBP (£).`);

  // 2. Fix US jobs (USD)
  // Identify jobs by country code 'US' or common US keywords
  const usJobs = await prisma.jobs.findMany({
    where: {
      OR: [
        { country: 'US' },
        { country: 'USA' },
        { location: { contains: 'New York', mode: 'insensitive' } },
        { location: { contains: 'San Francisco', mode: 'insensitive' } },
        { location: { contains: 'Los Angeles', mode: 'insensitive' } },
        { location: { contains: 'California', mode: 'insensitive' } },
        { location: { contains: 'Texas', mode: 'insensitive' } },
      ]
    }
  });

  console.log(`🇺🇸 Found ${usJobs.length} US jobs to update.`);

  let updatedUsCount = 0;
  for (let i = 0; i < usJobs.length; i += batchSize) {
    const batch = usJobs.slice(i, i + batchSize);
    const ids = batch.map(job => job.id);
    
    await prisma.jobs.updateMany({
      where: { id: { in: ids } },
      data: { salaryCurrency: 'USD' }
    });
    
    updatedUsCount += ids.length;
  }

  console.log(`✅ Updated ${updatedUsCount} US jobs to USD ($).`);

  console.log('🎉 All salary currencies fixed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });