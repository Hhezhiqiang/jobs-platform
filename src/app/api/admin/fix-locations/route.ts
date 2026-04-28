import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/fix-locations
export async function POST() {
  try {
    // 查找所有 Adzuna 职位
    const jobs = await prisma.jobs.findMany({
      where: { sourceId: { startsWith: 'adzuna-' } },
      take: 500
    });

    let fixed = 0;
    for (const job of jobs) {
      if (!job.city && job.location) {
        const city = job.location.split(',').pop()?.trim() || job.location;
        await prisma.jobs.update({
          where: { id: job.id },
          data: { city }
        });
        fixed++;
      }
    }

    return NextResponse.json({
      success: true,
      fixed,
      message: `修复了 ${fixed} 个职位的地点信息`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
