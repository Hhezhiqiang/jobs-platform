export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WithdrawalStatus } from "@prisma/client";

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
    const status = searchParams.get("status") as WithdrawalStatus | null;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.withdrawal_records.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { requestedAt: "desc" },
        include: { promoters: true },
      }),
      prisma.withdrawal_records.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin withdrawals error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
