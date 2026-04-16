import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }
  return { session, userId: session.user.id };
}

// 获取广告列表
export async function GET() {
  try {
    const ads = await prisma.ads.findMany({
      include: { ad_positions: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ads });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建广告
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("json" in auth) return auth;

  try {
    const body = await request.json();

    const position = await prisma.ad_positions.findFirst({
      where: { name: body.positionId },
    });
    if (!position) {
      return NextResponse.json({ error: "广告位不存在" }, { status: 400 });
    }

    const ad = await prisma.ads.create({
      data: {
        title: body.title,
        type: body.type || "IMAGE",
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl,
        textContent: body.textContent || null,
        positionId: position.id,
        authorId: auth.userId,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// 更新广告
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ("json" in auth) return auth;

  try {
    const body = await request.json();
    const ad = await prisma.ads.update({
      where: { id: body.id },
      data: {
        title: body.title,
        type: body.type,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl,
        textContent: body.textContent,
        positionId: body.positionId,
        status: body.status,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });
    return NextResponse.json(ad);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除广告
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("json" in auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    await prisma.ads.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
