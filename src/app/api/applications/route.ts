import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from '@/lib/logger';
export const dynamic = "force-dynamic";

// 获取当前用户的职位申请列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.job_applicationsWhereInput = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status as Prisma.EnumApplicationStatusFilter<"job_applications">;
    }

    const applications = await prisma.job_applications.findMany({
      where,
      take: 100,
      include: {
        jobs: { include: { companies: true } },
        resumes: true,
      },
      orderBy: { appliedAt: "desc" },
    });

    const validApplications = applications.filter(
      (app) => app.jobs?.slug && app.jobs.slug !== "" && app.jobs.companies?.slug && app.jobs.companies.slug !== ""
    );

    return NextResponse.json({ applications: validApplications });
  } catch (error) {
    logger.error("Get applications error:", error);
    return NextResponse.json({ error: "获取申请列表失败" }, { status: 500 });
  }
}

// 创建新申请（支持游客模式）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { jobId, resumeId, coverLetter, email, name } = body;

    if (!jobId) {
      return NextResponse.json({ error: "请提供职位ID" }, { status: 400 });
    }

    // 检查职位是否存在且活跃
    const job = await prisma.jobs.findUnique({ where: { id: jobId } });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json({ error: "该职位已停止招聘" }, { status: 400 });
    }

    // 游客申请
    if (!session?.user?.id) {
      if (!email?.trim()) {
        return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
      }

      // 检查是否已申请过
      const existing = await prisma.job_applications.findFirst({
        where: { jobId, guestEmail: email, status: { not: "WITHDRAWN" } },
      });

      if (existing) {
        return NextResponse.json(
          { error: "您已经用此邮箱申请过该职位，请勿重复申请" },
          { status: 400 }
        );
      }

      const application = await prisma.job_applications.create({
        data: { id: crypto.randomUUID(),
          jobId,
          guestEmail: email.trim(),
          guestName: name?.trim() || null,
          isLinked: false,
          coverLetter: coverLetter?.trim() || null,
          status: "PENDING",
        },
        include: { jobs: { include: { companies: true } } },
      });

      return NextResponse.json({ message: "申请成功", application }, { status: 201 });
    }

    // 注册用户申请
    const existing = await prisma.job_applications.findFirst({
      where: { jobId, userId: session.user.id, status: { not: "WITHDRAWN" } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "您已经申请过该职位，请勿重复申请" },
        { status: 400 }
      );
    }

    const application = await prisma.job_applications.create({
      data: { id: crypto.randomUUID(),
        jobId,
        userId: session.user.id,
        guestEmail: session.user.email || null,
        isLinked: true,
        resumeId: resumeId || null,
        coverLetter: coverLetter?.trim() || null,
        status: "PENDING",
      },
      include: { jobs: { include: { companies: true } } },
    });

    return NextResponse.json({ message: "申请成功", application }, { status: 201 });
  } catch (error) {
    logger.error("Create application error:", error);
    return NextResponse.json({ error: "申请失败" }, { status: 500 });
  }
}

// 更新申请（撤回）
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ error: "请提供申请ID和状态" }, { status: 400 });
    }

    const application = await prisma.job_applications.findFirst({
      where: { id: applicationId, userId: session.user.id },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    if (status === "WITHDRAWN" && application.status !== "PENDING") {
      return NextResponse.json({ error: "该申请已处理，无法撤回" }, { status: 400 });
    }

    const updatedApplication = await prisma.job_applications.update({
      where: { id: applicationId },
      data: { id: crypto.randomUUID(), status, ...(status === "WITHDRAWN" && { withdrewAt: new Date() }) },
    });

    return NextResponse.json({ message: "操作成功", application: updatedApplication });
  } catch (error) {
    logger.error("Update application error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// 删除申请
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("id");

    if (!applicationId) {
      return NextResponse.json({ error: "请提供申请ID" }, { status: 400 });
    }

    const application = await prisma.job_applications.findFirst({
      where: { id: applicationId, userId: session.user.id },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    await prisma.job_applications.delete({ where: { id: applicationId } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    logger.error("Delete application error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
