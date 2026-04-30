import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
      include: { jobs: {
          include: { companies: true },
        },
        resumes: true,
      },
      orderBy: { appliedAt: "desc" },
    });

    // 过滤掉 job 或 company 没有 slug 的申请
    const validApplications = applications.filter(app =>
      app.jobs?.slug && app.jobs.slug !== "" &&
      app.jobs.companies?.slug && app.jobs.companies.slug !== ""
    );

    return NextResponse.json({ applications: validApplications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "获取申请列表失败" }, { status: 500 });
  }
}

// 创建新申请
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { jobId, resumeId, coverLetter, email } = body;

    if (!jobId) {
      return NextResponse.json({ error: "请提供职位ID" }, { status: 400 });
    }

    // 检查职位是否存在且活跃
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json({ error: "该职位已停止招聘" }, { status: 400 });
    }

    // 未登录用户可以通过邮箱申请
    if (!session?.user?.id) {
      if (!email) {
        return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
      }

      // 检查是否已经用此邮箱申请过
      const existingApplication = await prisma.job_applications.findFirst({
        where: {
          jobId,
          guestEmail: email,
          status: { not: "WITHDRAWN" },
        },
      });

      if (existingApplication) {
        return NextResponse.json(
          { error: "您已经用此邮箱申请过该职位，请勿重复申请" },
          { status: 400 }
        );
      }

      // 创建游客申请
      const application = await prisma.job_applications.create({
        data: {
          jobId,
          guestEmail: email,
          coverLetter: coverLetter || null,
          status: "PENDING",
        },
        include: {
          jobs: {
            include: { companies: true },
          },
        },
      });

      return NextResponse.json(
        { message: "申请成功", application },
        { status: 201 }
      );
    }

    // 登录用户申请
    // 检查是否已经申请过
    const existingApplication = await prisma.job_applications.findFirst({
      where: {
        jobId,
        userId: session.user.id,
        status: { not: "WITHDRAWN" },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "您已经申请过该职位，请勿重复申请" },
        { status: 400 }
      );
    }

    // 创建申请
    const application = await prisma.job_applications.create({
      data: {
        jobId,
        userId: session.user.id,
        resumeId: resumeId || null,
        coverLetter: coverLetter || null,
        status: "PENDING",
      },
      include: {
        jobs: {
          include: { companies: true },
        },
      },
    });

    return NextResponse.json(
      { message: "申请成功", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create application error:", error);
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
      return NextResponse.json(
        { error: "请提供申请ID和状态" },
        { status: 400 }
      );
    }

    // 检查申请是否存在且属于当前用户
    const application = await prisma.job_applications.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    // 只能撤回待处理的申请
    if (status === "WITHDRAWN" && application.status !== "PENDING") {
      return NextResponse.json(
        { error: "该申请已处理，无法撤回" },
        { status: 400 }
      );
    }

    const updatedApplication = await prisma.job_applications.update({
      where: { id: applicationId },
      data: {
        status,
        ...(status === "WITHDRAWN" && { withdrewAt: new Date() }),
      },
    });

    return NextResponse.json({
      message: "操作成功",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application error:", error);
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

    // 检查申请是否存在且属于当前用户
    const application = await prisma.job_applications.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    await prisma.job_applications.delete({
      where: { id: applicationId },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}