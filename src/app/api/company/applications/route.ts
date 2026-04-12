import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// 检查权限
async function checkPermission(userId: string, role: string, companyId?: string) {
  if (role === "ADMIN") return { allowed: true, companyId: null };

  const membership = await prisma.companyMember.findFirst({
    where: {
      userId,
      ...(companyId && { companyId }),
    },
    include: {
      company: true,
    },
  });

  if (!membership) return { allowed: false, companyId: null };

  return { allowed: true, companyId: membership.companyId };
}

// 获取简历申请列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const { allowed, companyId } = await checkPermission(
      session.user.id,
      session.user.role || "USER"
    );

    if (!allowed) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const where: Prisma.JobApplicationWhereInput = {};

    if (companyId) {
      where.job = {
        companyId,
      };
    }

    if (status) {
      where.status = status as
        | "PENDING"
        | "VIEWED"
        | "INTERVIEW"
        | "REJECTED"
        | "OFFER"
        | "WITHDRAWN";
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
        resume: true,
      },
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "获取申请列表失败" }, { status: 500 });
  }
}