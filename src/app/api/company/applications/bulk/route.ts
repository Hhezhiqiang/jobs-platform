import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function checkPermission(userId: string, role: string, applicationId: string) {
  if (role === "ADMIN") return true;

  const application = await prisma.job_applications.findUnique({
    where: { id: applicationId },
    include: { jobs: {
        include: { companies: {
            include: { company_members: { where: { userId } },
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

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: "待处理",
    VIEWED: "已查看",
    INTERVIEW: "面试",
    REJECTED: "不合适",
    OFFER: "录用",
  };
  return map[status] || status;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "VIEWED", "INTERVIEW", "REJECTED", "OFFER"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "无效的状态" }, { status: 400 });
    }

    // 逐条校验权限（通常数量不大）
    for (const id of ids) {
      const ok = await checkPermission(
        session.user.id,
        session.user.role || "USER",
        id
      );
      if (!ok) {
        return NextResponse.json({ error: "无权操作部分记录" }, { status: 403 });
      }
    }

    const updateData: any = {
      status,
      respondedAt: new Date(),
    };
    if (status === "VIEWED") {
      updateData.viewedAt = new Date();
    }

    await prisma.job_applications.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    // 给申请者发通知
    const applications = await prisma.job_applications.findMany({
      where: { id: { in: ids } },
      include: { jobs: { select: { title: true } },
        users: { select: { id: true } },
      },
    });

    for (const app of applications) {
      try {
        await prisma.notifications.create({
          data: {
            userId: app.userId,
            type: "APPLICATION_UPDATE",
            title: "申请状态更新",
            content: `您在「${app.jobs.title}」职位的申请状态已更新为：${getStatusText(status)}`,
            metadata: { applicationId: app.id, jobId: app.jobId, status },
          },
        });
      } catch {
        // 忽略单条通知失败
      }
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk update applications error:", error);
    return NextResponse.json({ error: "批量更新失败" }, { status: 500 });
  }
}
