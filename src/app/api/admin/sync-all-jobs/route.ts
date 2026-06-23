import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncAllJobs } from '@/lib/job-api-aggregator';
import { fetchAdzunaJobs } from '@/lib/adzuna-api';
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// POST /api/admin/sync-all-jobs
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '无权操作' },
      { status: 403 }
    );
  }

  try {
    const { keyword, location, source } = await req.json();

    let count: number;

    // 单次同步
    if (keyword && source) {
      switch (source) {
        case 'JOOBLE':
          count = await (await import('@/lib/job-api-aggregator')).fetchJoobleJobs(keyword, location);
          break;
        case 'MUSE':
          count = await (await import('@/lib/job-api-aggregator')).fetchMuseJobs(keyword, location);
          break;
        case 'ADZUNA':
          count = await fetchAdzunaJobs(keyword, location);
          break;
        default:
          return NextResponse.json({ error: '不支持的源' }, { status: 400 });
      }
    } else {
      // 批量同步所有 API
      count = await syncAllJobs();
    }

    return NextResponse.json({
      success: true,
      count,
      message: `成功同步 ${count} 个职位`
    });
  } catch (error: any) {
    logger.error('Sync jobs error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
