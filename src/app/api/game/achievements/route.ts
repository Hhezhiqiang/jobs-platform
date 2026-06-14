export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const profile = await prisma.user_game_profiles.findUnique({
      where: { userId: session.user.id },
      include: {
        user_achievements: {
          include: {
            achievements: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "游戏档案不存在" }, { status: 404 });
    }

    // 获取所有成就定义
    const allAchievements = await prisma.achievements.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // 构建响应数据
    const unlockedIds = new Set(profile.user_achievements.map(a => a.achievementId));
    
    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      unlockedAt: profile.user_achievements.find(a => a.achievementId === achievement.id)?.unlockedAt,
    }));

    return NextResponse.json({
      success: true,
      achievements,
      unlockedCount: profile.user_achievements.length,
      totalCount: allAchievements.length,
    });
  } catch (error) {
    logger.error("获取成就列表失败:", error);
    return NextResponse.json(
      { error: "获取成就列表失败" },
      { status: 500 }
    );
  }
}
