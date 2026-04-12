export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function checkAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = checkAdmin(session);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "缺少日期范围" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [ordersAgg, commissionAgg, withdrawalsAgg, adjustmentsAgg] = await Promise.all([
      prisma.contactUnlockOrder.aggregate({
        where: { status: "PAID", createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.commissionRecord.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ["AVAILABLE", "WITHDRAWN"] },
        },
        _sum: { commissionAmount: true },
        _count: { id: true },
      }),
      prisma.withdrawalRecord.aggregate({
        where: {
          status: { in: ["PENDING", "APPROVED", "TRANSFERRING", "COMPLETED"] },
          requestedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.commissionAdjustment.aggregate({
        where: { createdAt: { gte: start, lte: end }, type: "REFUND" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const gmv = Number(ordersAgg._sum.amount || 0);
    const commissionPaid = Number(commissionAgg._sum.commissionAmount || 0);
    const withdrawalsPending = Number(withdrawalsAgg._sum.amount || 0);
    const refundClawbacks = Number(adjustmentsAgg._sum.amount || 0);
    const netProfit = gmv - commissionPaid;

    return NextResponse.json({
      success: true,
      summary: {
        gmv,
        orderCount: ordersAgg._count.id,
        commissionPaid,
        commissionCount: commissionAgg._count.id,
        withdrawalsPending,
        withdrawalCount: withdrawalsAgg._count.id,
        refundClawbacks,
        refundCount: adjustmentsAgg._count.id,
        netProfit,
      },
    });
  } catch (error) {
    console.error("Admin CPS report error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
