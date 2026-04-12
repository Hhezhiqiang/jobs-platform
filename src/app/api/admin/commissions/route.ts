export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clawbackCommission } from "@/lib/promoter";

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
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
    const promoterId = searchParams.get("promoterId");
    const status = searchParams.get("status");

    const where: any = {};
    if (promoterId) where.promoterId = promoterId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { promoter: true, link: true },
      }),
      prisma.commissionRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        orderAmount: Number(item.orderAmount),
        rate: Number(item.rate),
        commissionAmount: Number(item.commissionAmount),
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin commissions error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = checkAdmin(session);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { commissionId } = body;

    if (!commissionId) {
      return NextResponse.json({ error: "缺少 commissionId" }, { status: 400 });
    }

    await clawbackCommissionById(commissionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin commission clawback error:", error);
    return NextResponse.json({ error: "追回失败" }, { status: 500 });
  }
}

async function clawbackCommissionById(commissionId: string) {
  const commission = await prisma.commissionRecord.findUnique({
    where: { id: commissionId },
  });
  if (!commission || commission.status === "CLAWED_BACK") return;

  await prisma.$transaction(async (tx) => {
    await tx.commissionAdjustment.create({
      data: {
        commissionRecordId: commission.id,
        promoterId: commission.promoterId,
        amount: commission.commissionAmount,
        reason: "后台手动追回",
        type: "MANUAL",
      },
    });

    await tx.promoter.update({
      where: { id: commission.promoterId },
      data: {
        availableBalance: { decrement: commission.commissionAmount },
        totalEarnings: { decrement: commission.commissionAmount },
      },
    });

    await tx.commissionRecord.update({
      where: { id: commission.id },
      data: { status: "CLAWED_BACK" },
    });
  });
}
