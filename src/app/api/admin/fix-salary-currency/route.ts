import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

/**
 * 修复薪资货币符号 API
 * 访问此接口以在服务器端修复历史数据
 */
export async function GET(request: Request) {
  try {
    // 1. 修复英国职位 (GBP)
    const ukJobs = await prisma.jobs.findMany({
      where: {
        OR: [
          { country: 'GB' },
          { country: 'UK' },
          { location: { contains: 'London', mode: 'insensitive' } },
          { location: { contains: 'Manchester', mode: 'insensitive' } },
          { location: { contains: 'Birmingham', mode: 'insensitive' } },
        ]
      }
    });

    const ukIds = ukJobs.map(j => j.id);
    if (ukIds.length > 0) {
      await prisma.jobs.updateMany({
        where: { id: { in: ukIds } },
        data: { salaryCurrency: 'GBP' }
      });
    }

    // 2. 修复美国职位 (USD)
    const usJobs = await prisma.jobs.findMany({
      where: {
        OR: [
          { country: 'US' },
          { country: 'USA' },
          { location: { contains: 'New York', mode: 'insensitive' } },
          { location: { contains: 'San Francisco', mode: 'insensitive' } },
        ]
      }
    });

    const usIds = usJobs.map(j => j.id);
    if (usIds.length > 0) {
      await prisma.jobs.updateMany({
        where: { id: { in: usIds } },
        data: { salaryCurrency: 'USD' }
      });
    }

    // 3. 清除首页和职位列表页缓存
    revalidatePath('/zh');
    revalidatePath('/zh/jobs');
    revalidatePath('/en');
    revalidatePath('/en/jobs');

    return NextResponse.json({
      success: true,
      message: `Fixed ${ukIds.length} UK jobs to GBP, ${usIds.length} US jobs to USD. Cache cleared.`,
    });
  } catch (error: any) {
    logger.error("Fix salary error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
