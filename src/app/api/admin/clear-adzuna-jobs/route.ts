import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/clear-adzuna-jobs
export async function DELETE() {
  try {
    const result = await prisma.jobs.deleteMany({
      where: {
        sourceId: { startsWith: 'adzuna-' }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `已删除 ${result.count} 个 Adzuna 职位`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
