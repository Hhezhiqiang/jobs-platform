export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedPromoter } from "@/lib/promoter-auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));

  try {
    const [items, total] = await Promise.all([
      prisma.commission_records.findMany({
        where: { promoterId: promoter.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderAmount: true,
          rate: true,
          commissionAmount: true,
          status: true,
          createdAt: true,
          availableAt: true,
        },
      }),
      prisma.commission_records.count({ where: { promoterId: promoter.id } }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        orderAmount: Number(item.orderAmount),
        rate: Number(item.rate),
        commissionAmount: Number(item.commissionAmount),
      })),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Promoter commissions error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
