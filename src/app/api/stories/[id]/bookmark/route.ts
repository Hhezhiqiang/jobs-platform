import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET: 检查用户是否已收藏该故事
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isBookmarked: false }, { status: 200 });
    }

    const bookmark = await prisma.storyBookmark.findUnique({
      where: {
        storyId_userId: {
          storyId: params.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error("Check bookmark error:", error);
    return NextResponse.json({ isBookmarked: false }, { status: 200 });
  }
}

/**
 * POST: 切换收藏状态
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const storyId = params.id;
    const userId = session.user.id;

    // 检查故事是否存在
    const story = await prisma.careerStory.findUnique({
      where: { id: storyId },
    });
    if (!story) {
      return NextResponse.json({ error: "故事不存在" }, { status: 404 });
    }

    // 切换收藏状态
    const existing = await prisma.storyBookmark.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (existing) {
      // 取消收藏
      await prisma.storyBookmark.delete({
        where: { storyId_userId: { storyId, userId } },
      });
      return NextResponse.json({ isBookmarked: false });
    } else {
      // 添加收藏
      await prisma.storyBookmark.create({
        data: { storyId, userId },
      });
      return NextResponse.json({ isBookmarked: true });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return NextResponse.json({ error: "收藏操作失败" }, { status: 500 });
  }
}
