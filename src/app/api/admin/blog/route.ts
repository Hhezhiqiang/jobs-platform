import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET: 获取博客列表（管理用）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { type: "BLOG" };
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.pages.findMany({
        where,
        include: { users: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pages.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    logger.error("[admin-blog] GET error:", error);
    return NextResponse.json({ error: "获取博客列表失败" }, { status: 500 });
  }
}

// PUT: 更新博客状态（发布/归档/草稿）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, action } = body;

    if (!id) return NextResponse.json({ error: "缺少博客ID" }, { status: 400 });

    // 批量发布所有草稿
    if (action === "publishAll") {
      const result = await prisma.pages.updateMany({
        where: { type: "BLOG", status: "DRAFT" },
        data: { status: "PUBLISHED" },
      });
      return NextResponse.json({ 
        success: true, 
        message: `已发布 ${result.count} 篇博客`,
        count: result.count,
      });
    }

    // 单篇状态切换
    if (status && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(status)) {
      const post = await prisma.pages.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, post });
    }

    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch (error: any) {
    logger.error("[admin-blog] PUT error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// DELETE: 删除博客
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少博客ID" }, { status: 400 });

    await prisma.pages.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "博客已删除" });
  } catch (error: any) {
    logger.error("[admin-blog] DELETE error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}