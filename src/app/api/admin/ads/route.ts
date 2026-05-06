export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const prisma = getPrisma();
    const positions = await prisma.ad_positions.findMany({
      include: {
        ads: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, positions });
  } catch (error: any) {
    logger.error("[api/admin/ads] error:", error);
    return NextResponse.json(
      { error: error.message || "获取广告列表失败" },
      { status: 500 }
    );
  }
}
