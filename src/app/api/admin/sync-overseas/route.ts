import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncOverseasJobs } from '@/scripts/sync-overseas-jobs';

// POST /api/admin/sync-overseas
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '无权操作' },
      { status: 403 }
    );
  }

  try {
    // 异步执行
    syncOverseasJobs().catch(console.error);
    
    return NextResponse.json({
      success: true,
      message: '海外职位同步已开始，请稍后查看结果'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/sync-overseas/test
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '无权操作' },
      { status: 403 }
    );
  }

  try {
    const total = await syncOverseasJobs();
    
    return NextResponse.json({
      success: true,
      total,
      message: `成功同步 ${total} 个海外职位`
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
