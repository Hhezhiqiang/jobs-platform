export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedPromoter } from "@/lib/promoter-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;
  const promoterId = promoter.id;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    const promoterWithLinks = await prisma.promoter.findUnique({
      where: { id: promoterId },
      include: { links: true },
    });

    // 今日数据（按实际创建时间）
    const [todayRegisters, todayOrders, todayGmv, todayCommission] = await Promise.all([
      prisma.userReferral.count({
        where: { promoterId, createdAt: { gte: todayStart } },
      }),
      prisma.contactUnlockOrder.count({
        where: { commission: { promoterId }, status: "PAID", createdAt: { gte: todayStart } },
      }),
      prisma.contactUnlockOrder.aggregate({
        where: { commission: { promoterId }, status: "PAID", createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: { promoterId, createdAt: { gte: todayStart } },
        _sum: { commissionAmount: true },
      }),
    ]);

    // 累计数据
    const [totalRegisters, totalOrders, totalGmv, totalCommissionPaid] = await Promise.all([
      prisma.userReferral.count({ where: { promoterId } }),
      prisma.contactUnlockOrder.count({
        where: { commission: { promoterId }, status: "PAID" },
      }),
      prisma.contactUnlockOrder.aggregate({
        where: { commission: { promoterId }, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: { promoterId, status: { in: ["AVAILABLE", "WITHDRAWN"] } },
        _sum: { commissionAmount: true },
      }),
    ]);

    // 近30天趋势（按天聚合）
    const commissions = await prisma.commissionRecord.groupBy({
      by: ["createdAt"],
      where: { promoterId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { commissionAmount: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      trendMap.set(key, 0);
    }

    commissions.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (trendMap.has(key)) {
        trendMap.set(key, trendMap.get(key)! + Number(c._sum.commissionAmount || 0));
      }
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, commission]) => ({ date, commission: Number(commission.toFixed(8)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalClicks = promoterWithLinks?.links.reduce((sum, l) => sum + l.clickCount, 0) || 0;

    return NextResponse.json({
      success: true,
      today: {
        clicks: totalClicks, // 历史累计点击，非今日精确
        registers: todayRegisters,
        orders: todayOrders,
        gmv: Number(todayGmv._sum.amount || 0),
        commission: Number(todayCommission._sum.commissionAmount || 0),
      },
      total: {
        clicks: totalClicks,
        registers: totalRegisters,
        orders: totalOrders,
        gmv: Number(totalGmv._sum.amount || 0),
        commission: Number(totalCommissionPaid._sum.commissionAmount || 0),
      },
      trend,
      balances: {
        available: Number(promoter.availableBalance),
        frozen: Number(promoter.frozenBalance),
        withdrawn: Number(promoter.withdrawnBalance),
      },
    });
  } catch (error) {
    console.error("Promoter dashboard error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
