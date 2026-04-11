import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApplicationStatusNotification } from "@/lib/notifications";
export const dynamic = "force-dynamic";

// 更新申请状态（招聘方使用）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查用户是否有权限（职位发布者或管理员）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const applicationId = params.id;
    const body = await request.json();
    const { status: newStatus, responseNote } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "请提供状态" },
        { status: 400 }
      );
    }

    // 获取申请信息
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { company: true },
        },
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }

    // 检查权限：只有职位发布者、公司账户或管理员可以更新状态
    const isAuthorized =
      user?.role === "ADMIN" ||
      application.job.authorId === session.user.id;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "无权操作此申请" },
        { status: 403 }
      );
    }

    const oldStatus = application.status;

    // 更新申请状态
    const updateData: any = {
      status: newStatus,
    };

    // 根据状态设置相应的时间字段
    if (newStatus === "VIEWED" && !application.viewedAt) {
      updateData.viewedAt = new Date();
    } else if (
      ["INTERVIEW", "REJECTED", "OFFER"].includes(newStatus) &&
      !application.respondedAt
    ) {
      updateData.respondedAt = new Date();
      updateData.responseType = newStatus;
    }

    if (responseNote) {
      updateData.responseNote = responseNote;
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        job: {
          include: { company: true },
        },
        user: true,
      },
    });

    // 创建通知（如果状态发生变化）
    if (oldStatus !== newStatus) {
      await createApplicationStatusNotification(
        application.userId,
        applicationId,
        application.job.title,
        application.job.company.name,
        oldStatus,
        newStatus
      );
    }

    return NextResponse.json({
      message: "状态更新成功",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}