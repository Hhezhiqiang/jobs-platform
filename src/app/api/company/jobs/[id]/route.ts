import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 检查权限
async function checkPermission(userId: string, role: string, jobId: string) {
  if (role === "ADMIN") return true;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!job) return false;

  const membership = job.company.members[0];
  if (!membership) return false;

  return membership.role === "ADMIN" || membership.role === "RECRUITER";
}

// 获取职位详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      session.user.role || "USER",
      id
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
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
    });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json({ error: "获取职位失败" }, { status: 500 });
  }
}

// 更新职位
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      session.user.role || "USER",
      id
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      benefits,
      employmentType,
      experience,
      salaryMin,
      salaryMax,
      location,
      city,
      isRemote,
      isHybrid,
      applyUrl,
      status,
    } = body;

    const job = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        requirements,
        benefits,
        employmentType,
        experience,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        location,
        city,
        isRemote,
        isHybrid,
        applyUrl,
        status,
      },
    });

    return NextResponse.json({ message: "更新成功", job });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除职位
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      session.user.role || "USER",
      id
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}