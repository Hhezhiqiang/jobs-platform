import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/debug/jobs
export async function GET() {
  try {
    const jobs = await prisma.jobs.findMany({
      take: 10,
      orderBy: { datePosted: 'desc' },
      select: {
        id: true,
        title: true,
        location: true,
        city: true,
        country: true,
        companyId: true,
        authorId: true,
        sourceId: true
      }
    });

    const total = await prisma.jobs.count();

    return NextResponse.json({
      total,
      recent: jobs.map(job => ({
        title: job.title?.substring(0, 50),
        location: job.location,
        city: job.city,
        country: job.country,
        hasCompany: !!job.companyId,
        hasAuthor: !!job.authorId,
        sourceId: job.sourceId
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
