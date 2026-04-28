import { NextResponse } from 'next/server';
import { fetchMuseJobs } from '@/lib/job-api-aggregator';

// GET /api/jobs/test-muse
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'developer';
  const location = searchParams.get('location') || 'Remote';

  try {
    const count = await fetchMuseJobs(keyword, location);
    return NextResponse.json({
      success: true,
      count,
      message: `The Muse 同步成功！新增 ${count} 个职位`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
