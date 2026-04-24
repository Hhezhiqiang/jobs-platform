export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 15;
    const skip = (page - 1) * limit;

    const where: any = {};

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        include: {
          companies: { select: { id: true, name: true, logo: true } },
          _count: { select: { job_applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      totalCount: total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[api/admin/jobs] error:", error);
    return NextResponse.json(
      { error: error.message || "获取职位列表失败" },
      { status: 500 }
    );
  }
}
