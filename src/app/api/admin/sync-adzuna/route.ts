import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchAdzunaJobs, fetchAdzunaBulkJobs, type ProgressCallback } from '@/lib/adzuna-api';
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// POST /api/admin/sync-adzuna
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '无权操作' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { keyword, location, bulk, pages, stream } = body;

    if (stream) {
      // SSE 流式进度报告
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      const progressCallback: ProgressCallback = (progress) => {
        const data = `data: ${JSON.stringify(progress)}\n\n`;
        writer.write(encoder.encode(data)).catch(() => {});
      };

      // 异步执行同步，完成后关闭流
      (async () => {
        try {
          let result;
          if (bulk) {
            result = await fetchAdzunaBulkJobs({
              pages,
              onProgress: progressCallback,
            });
          } else {
            const count = await fetchAdzunaJobs(keyword, location, 1);
            result = { total: count, fetched: count, inserted: count, skipped: 0, failed: 0, aiCalls: 0 };
          }
          progressCallback({
            phase: 'done',
            fetched: result.fetched,
            parsed: 0,
            inserted: result.inserted,
            skipped: result.skipped,
            failed: result.failed,
            aiCalls: result.aiCalls,
            totalPages: 0,
            message: '同步完成',
          });
        } catch (error: unknown) {
          const errData = `data: ${JSON.stringify({ phase: 'error', message: (error as Error).message })}\n\n`;
          writer.write(encoder.encode(errData)).catch(() => {});
        } finally {
          writer.close().catch(() => {});
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 普通 JSON 响应
    let result: Awaited<ReturnType<typeof fetchAdzunaBulkJobs>>;

    if (bulk) {
      result = await fetchAdzunaBulkJobs({ pages });
    } else {
      const count = await fetchAdzunaJobs(keyword, location, 1);
      result = { total: count, fetched: count, inserted: count, skipped: 0, failed: 0, aiCalls: 0 };
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `同步完成: 新增 ${result.inserted} 个, 跳过 ${result.skipped} 个`,
    });
  } catch (error: unknown) {
    logger.error('Sync Adzuna error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
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
      location,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
