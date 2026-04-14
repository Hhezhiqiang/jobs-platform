import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 检查权限
async function checkPermission(userId: string, role: string, applicationId: string) {
  if (role === "ADMIN") return true;

  const application = await prisma.job_applications.findUnique({
    where: { id: applicationId },
    include: { jobs: {
        include: {
          companies: {
            include: { company_members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (!application) return false;

  const membership = application.jobs.companies.company_members[0];
  if (!membership) return false;

  return membership.role === "ADMIN" || membership.role === "RECRUITER";
}

// 获取申请详情
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

    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: { jobs: {
          select: {
            id: true,
            title: true,
            slug: true,
            companies: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            user_profiles: true,
          },
        },
        resumes: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    // 标记为已查看
    if (application.status === "PENDING") {
      await prisma.job_applications.update({
        where: { id },
        data: {
          status: "VIEWED",
          viewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json({ error: "获取申请详情失败" }, { status: 500 });
  }
}

// 更新申请状态
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
    const { status, responseNote, responseType } = body;

    if (!status) {
      return NextResponse.json(
        { error: "请提供状态" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "VIEWED", "INTERVIEW", "REJECTED", "OFFER"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "无效的状态" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      respondedAt: new Date(),
    };

    if (responseNote) {
      updateData.responseNote = responseNote;
    }

    if (responseType) {
      updateData.responseType = responseType;
    }

    if (status === "VIEWED" && !updateData.viewedAt) {
      updateData.viewedAt = new Date();
    }

    const application = await prisma.job_applications.update({
      where: { id },
      data: updateData,
      include: { jobs: {
          select: {
            title: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 发送通知给申请者
    await prisma.notifications.create({
      data: {
        userId: application.userId,
        type: "APPLICATION_UPDATE",
        title: "申请状态更新",
        content: `您在「${application.jobs.title}」职位的申请状态已更新为：${getStatusText(status)}`,
        metadata: {
          applicationId: id,
          jobId: application.jobId,
          status,
        },
      },
    });

    return NextResponse.json({
      message: "状态更新成功",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 发送回复消息
export async function POST(
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
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "请填写回复内容" },
        { status: 400 }
      );
    }

    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: { jobs: {
          select: {
            title: true,
            companies: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    // 发送通知给申请者
    await prisma.notifications.create({
      data: {
        userId: application.userId,
        type: "INTERVIEW_INVITE",
        title: `${application.jobs.companies.name} 给您发送了消息`,
        content: message,
        metadata: {
          applicationId: id,
          jobId: application.jobId,
        },
      },
    });

    return NextResponse.json({ message: "回复已发送" });
  } catch (error) {
    console.error("Send response error:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "待处理",
    VIEWED: "已查看",
    INTERVIEW: "面试",
    REJECTED: "不合适",
    OFFER: "录用",
  };
  return statusMap[status] || status;
}