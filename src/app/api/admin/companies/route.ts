import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';
export const dynamic = "force-dynamic";

// 获取企业列表（仅管理员）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.verificationStatus = status;
    }

    const companies = await prisma.companies.findMany({
      where,
      take: 200,
      include: {
        company_members: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    logger.error("Get admin companies error:", error);
    return NextResponse.json({ error: "获取企业列表失败" }, { status: 500 });
  }
}

// 审核企业
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, status, rejectionReason } = body;

    if (!companyId || !status) {
      return NextResponse.json(
        { error: "请提供企业ID和审核状态" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { error: "无效的审核状态" },
        { status: 400 }
      );
    }

    const updateData: any = {
      verificationStatus: status,
    };

    if (status === "APPROVED") {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = session.user.id;
    }

    if (status === "REJECTED" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const company = await prisma.companies.update({
      where: { id: companyId },
      data: updateData,
      include: { company_members: {
          include: {
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // 发送通知给企业成员
    const notificationTitle =
      status === "APPROVED"
        ? "企业认证通过"
        : status === "REJECTED"
        ? "企业认证未通过"
        : "企业账号已暂停";

    const notificationContent =
      status === "APPROVED"
        ? `恭喜！您的企业「${company.name}」已通过认证，现在可以发布职位了。`
        : status === "REJECTED"
        ? `您的企业「${company.name}」认证未通过${
            rejectionReason ? `，原因：${rejectionReason}` : ""
          }。请修改后重新提交。`
        : `您的企业「${company.name}」账号已被暂停，请联系管理员。`;

    for (const member of company.company_members) {
      await prisma.notifications.create({
        data: {
          userId: member.users.id,
          type: "SYSTEM",
          title: notificationTitle,
          content: notificationContent,
          metadata: {
            companyId: company.id,
            status,
          },
        },
      });
    }

    return NextResponse.json({
      message: "审核成功",
      company,
    });
  } catch (error) {
    logger.error("Review company error:", error);
    return NextResponse.json({ error: "审核失败" }, { status: 500 });
  }
}