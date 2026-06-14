import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addExp } from "@/lib/game/exp-system";
import { logger } from '@/lib/logger';

// POST: 用户共鸣故事
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 验证用户登录
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: storyId } = params;
    const userId = session.user.id;

    // 检查故事是否存在
    const story = await prisma.career_stories.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: "故事不存在" }, { status: 404 });
    }

    // 检查用户是否已经共鸣过（利用@@unique约束）
    const existingResonance = await prisma.story_resonances.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingResonance) {
      return NextResponse.json(
        { error: "已共鸣", alreadyResonated: true },
        { status: 409 }
      );
    }

    // 使用Prisma事务确保原子性操作
    const [resonance, updatedStory] = await prisma.$transaction(async (tx) => {
      // 创建共鸣记录
      const newResonance = await tx.story_resonances.create({
        data: {
          storyId,
          userId,
        },
      });

      // 更新故事的共鸣计数
      const updated = await tx.career_stories.update({
        where: { id: storyId },
        data: {
          resonanceCount: {
            increment: 1,
          },
        },
      });

      return [newResonance, updated];
    });

    // 给用户添加经验值（+3）
    // 使用GET_LIKE类型，因为RESONANCE是类似的社交互动
    await addExp(userId, "GET_LIKE", "共鸣故事", storyId);

    return NextResponse.json({
      success: true,
      resonanceCount: updatedStory.resonanceCount,
    });
  } catch (error) {
    logger.error("[Resonance POST Error]", error);
    
    // 处理Prisma的唯一约束冲突错误
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "已共鸣", alreadyResonated: true },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: "共鸣失败" }, { status: 500 });
  }
}
