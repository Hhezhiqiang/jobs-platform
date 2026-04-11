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
    const monitorId = searchParams.get("monitorId");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};
    if (monitorId) where.monitorId = monitorId;
    if (status) where.status = status;

    const items = await prisma.sEOPlan.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      take: limit,
      skip: offset,
      include: { monitor: true },
    });

    return NextResponse.json({ items, limit, offset });
  } catch (error) {
    console.error("[api/admin/seo-plans] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status, contentMarkdown } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (contentMarkdown !== undefined) data.contentMarkdown = contentMarkdown;
    if (status === "APPROVED") data.approvedAt = new Date();
    if (status === "PUBLISHED") data.publishedAt = new Date();

    const updated = await prisma.sEOPlan.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/admin/seo-plans] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
