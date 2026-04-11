import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取企业 Dashboard 数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户关联的企业
    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        company: true,
      },
    });

    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "您还不是企业用户", needRegister: true },
        { status: 403 }
      );
    }

    // 管理员可以查看所有数据，企业用户只能查看自己的
    const companyId = membership?.companyId;

    // 统计职位数量
    const jobsCount = await prisma.job.count({
      where: companyId ? { companyId } : {},
    });

    const activeJobsCount = await prisma.job.count({
      where: companyId
        ? { companyId, status: "ACTIVE" }
        : { status: "ACTIVE" },
    });

    // 统计申请数量
    const applicationsCount = await prisma.jobApplication.count({
      where: companyId
        ? {
            job: {
              companyId,
            },
          }
        : {},
    });

    const pendingApplicationsCount = await prisma.jobApplication.count({
      where: companyId
        ? {
            status: "PENDING",
            job: {
              companyId,
            },
          }
        : { status: "PENDING" },
    });

    // 获取最近的申请
    const recentApplications = await prisma.jobApplication.findMany({
      where: companyId
        ? {
            job: {
              companyId,
            },
          }
        : {},
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
          },
        },
      },
      orderBy: { appliedAt: "desc" },
      take: 10,
    });

    // 获取最近的职位
    const recentJobs = await prisma.job.findMany({
      where: companyId ? { companyId } : {},
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      company: membership?.company || null,
      memberRole: membership?.role || null,
      stats: {
        jobsCount,
        activeJobsCount,
        applicationsCount,
        pendingApplicationsCount,
      },
      recentApplications,
      recentJobs,
    });
  } catch (error) {
    console.error("Get company dashboard error:", error);
    return NextResponse.json(
      { error: "获取 Dashboard 数据失败" },
      { status: 500 }
    );
  }
}