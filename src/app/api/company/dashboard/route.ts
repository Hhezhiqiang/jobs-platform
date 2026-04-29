import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successNextResponse, ApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// 获取企业 Dashboard 数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户关联的企业（按角色排序，优先获取 ADMIN 角色的企业）
    const membership = await prisma.company_members.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: {
        role: "asc", // ADMIN 字母顺序在前
      },
    });

    // 非管理员且无企业关联，直接拒绝
    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "您还不是企业用户", needRegister: true },
        { status: 403 }
      );
    }

    // 安全加固：企业用户只能查看自己关联企业的数据
    // 管理员可以查看所有数据
    const isAdmin = session.user.role === "ADMIN";
    const companyId = membership?.companyId ?? null;

    // 对于企业用户，强制使用 companyId 过滤；管理员不限制
    const jobFilter = isAdmin ? {} : { companyId: companyId! };
    const applicationFilter = isAdmin
      ? {}
      : { jobs: { companyId: companyId! } };

    // 统计职位数量
    const jobsCount = await prisma.jobs.count({
      where: jobFilter,
    });

    const activeJobsCount = await prisma.jobs.count({
      where: { ...jobFilter, status: "ACTIVE" },
    });

    // 统计申请数量
    const applicationsCount = await prisma.job_applications.count({
      where: applicationFilter,
    });

    const pendingApplicationsCount = await prisma.job_applications.count({
      where: { ...applicationFilter, status: "PENDING" },
    });

    // 获取最近的申请
    const recentApplications = await prisma.job_applications.findMany({
      where: applicationFilter,
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        users: {
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
    const recentJobs = await prisma.jobs.findMany({
      where: jobFilter,
      include: {
        companies: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { job_applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      company: membership?.companies || null,
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