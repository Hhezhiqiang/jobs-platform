import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取广告列表
export async function GET() {
  try {
    const ads = await prisma.ad.findMany({
      include: { position: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ads });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建新广告
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();

    // 查找或创建广告位
    let position = await prisma.adPosition.findFirst({
      where: { name: body.positionId },
    });

    if (!position) {
      position = await prisma.adPosition.create({
        data: {
          name: body.positionId,
          displayName: body.positionId,
        },
      });
    }

    const ad = await prisma.ad.create({
      data: {
        title: body.title,
        type: body.type,
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl,
        textContent: body.textContent || null,
        positionId: position.id,
        authorId: session.user.id,
        status: "ACTIVE",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
