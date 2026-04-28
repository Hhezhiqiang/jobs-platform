import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchAdzunaJobs, fetchAdzunaBulkJobs } from '@/lib/adzuna-api';

// POST /api/admin/sync-adzuna
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '无权操作' },
      { status: 403 }
    );
  }

  try {
    const { keyword, location, bulk } = await req.json();

    let count: number;

    if (bulk) {
      // 批量获取
      count = await fetchAdzunaBulkJobs();
    } else {
      // 单次获取 - 使用 50 条结果获取更多新职位
      count = await fetchAdzunaJobs(keyword, location, 1);
    }

    return NextResponse.json({
      success: true,
      count,
      message: `成功同步 ${count} 个职位`
    });
  } catch (error: any) {
    console.error('Sync Adzuna error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/jobs/adzuna/test
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'frontend';
  const location = searchParams.get('location') || 'Beijing';

  try {
    const count = await fetchAdzunaJobs(keyword, location, 1);
    
    return NextResponse.json({
      success: true,
      count,
      keyword,
      location
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
