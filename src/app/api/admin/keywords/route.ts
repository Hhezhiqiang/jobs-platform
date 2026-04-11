export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (source) where.source = source;

    const [items, total] = await Promise.all([
      prisma.keywordMonitor.findMany({
        where,
        orderBy: { lastSeenAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { archives: true, seoPlans: true } },
        },
      }),
      prisma.keywordMonitor.count({ where }),
    ]);

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error("[api/admin/keywords] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
