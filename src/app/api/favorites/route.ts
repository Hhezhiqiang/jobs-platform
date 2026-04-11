import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.favorite.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      favorites,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取收藏列表失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    // 检查职位是否存在
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ error: "已收藏该职位" }, { status: 409 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        jobId,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("添加收藏失败:", error);
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}

// 取消收藏（通过 DELETE 方法）
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    // 查找收藏记录
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: "收藏记录不存在" }, { status: 404 });
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return NextResponse.json({ message: "取消收藏成功" });
  } catch (error) {
    console.error("取消收藏失败:", error);
    return NextResponse.json({ error: "取消失败" }, { status: 500 });
  }
}
