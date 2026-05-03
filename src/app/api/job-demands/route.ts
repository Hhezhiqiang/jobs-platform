import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/job-demands - 发布求职需求
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { title, salaryMin, salaryMax, currency, location, tags, bio } = body;

  if (!title) {
    return NextResponse.json({ error: "请输入求职意向标题" }, { status: 400 });
  }

  try {
    const demand = await prisma.jobDemand.create({
      data: {
        userId: session.user.id,
        title,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        currency: currency || "CNY",
        location: location || null,
        tags: tags || [],
        bio: bio || null,
      },
    });
    return NextResponse.json({ success: true, data: demand }, { status: 201 });
  } catch (error: any) {
    console.error("Create JobDemand error:", error);
    return NextResponse.json({ error: "发布失败" }, { status: 500 });
  }
}

// GET /api/job-demands - 获取求职需求列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  try {
    const [demands, total] = await Promise.all([
      prisma.jobDemand.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          location: true,
          tags: true,
          bio: true,
          createdAt: true,
          user: { select: { name: true, avatar: true } },
        },
      }),
      prisma.jobDemand.count({ where: { status: "OPEN" } }),
    ]);

    return NextResponse.json({ success: true, data: demands, total, page });
  } catch (error: any) {
    console.error("Get JobDemands error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
