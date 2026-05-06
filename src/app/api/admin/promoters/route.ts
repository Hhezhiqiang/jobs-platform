export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromoterStatus } from "@prisma/client";
import { logger } from '@/lib/logger';

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
    const status = searchParams.get("status") as PromoterStatus | null;
    const query = searchParams.get("query") || "";

    const where: any = {};
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.promoters.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.promoters.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map((p) => ({
        ...p,
        defaultRate: Number(p.defaultRate),
        availableBalance: Number(p.availableBalance),
        frozenBalance: Number(p.frozenBalance),
        withdrawnBalance: Number(p.withdrawnBalance),
        totalEarnings: Number(p.totalEarnings),
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("Admin promoters list error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
