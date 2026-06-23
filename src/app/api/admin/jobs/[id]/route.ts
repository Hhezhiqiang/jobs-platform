import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// GET /api/admin/jobs/[id] - 获取单个职位详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权操作' },
        { status: 403 }
      );
    }

    const { id } = params;
    
    const job = await prisma.jobs.findUnique({
      where: { id },
      include: {
        companies: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            job_applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: '职位不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job: {
        ...job,
        // 移除敏感字段
        companies: {
          name: job.companies?.name,
          logo: job.companies?.logo,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get job details error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
