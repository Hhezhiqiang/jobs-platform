import { NextResponse } from 'next/server';
import { fetchAdzunaJobs } from '@/lib/adzuna-api';

// GET /api/jobs/adzuna/test
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'frontend';
  const location = searchParams.get('location') || 'Beijing';

  try {
    console.log(`Testing Adzuna API: ${keyword} in ${location}`);
    const count = await fetchAdzunaJobs(keyword, location, 1);
    
    return NextResponse.json({
      success: true,
      count,
      keyword,
      location,
      message: `成功同步 ${count} 个职位`
    });
  } catch (error: any) {
    console.error('Adzuna test error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
