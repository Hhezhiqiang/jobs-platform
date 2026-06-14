export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from '@/lib/logger';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  level: number;
  title: string;
  exp: number;
  achievements: number;
  isCurrentUser: boolean;
}

/**
 * 获取排行榜数据
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "weekly";
    const limit = parseInt(searchParams.get("limit") || "20");

    let whereClause = {};
    const now = new Date();

    if (type === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereClause = { createdAt: { gte: weekAgo } };
    } else if (type === "monthly") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      whereClause = { createdAt: { gte: monthAgo } };
    }

    let leaderboard: LeaderboardEntry[] = [];

    if (type === "alltime") {
      const profiles = await prisma.user_game_profiles.findMany({
        orderBy: [{ level: "desc" }, { exp: "desc" }],
        take: limit,
        include: {
          users: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { user_achievements: true },
          },
        },
      });

      leaderboard = profiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.users.id,
        name: profile.users.name || "匿名用户",
        avatar: profile.users.avatar,
        level: profile.level,
        title: profile.title,
        exp: profile.exp,
        achievements: profile._count.user_achievements,
        isCurrentUser: profile.users.id === session?.user?.id,
      }));
    } else {
      const expLogs = await prisma.exp_logs.groupBy({
        by: ["profileId"],
        where: whereClause,
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });

      const profileIds = expLogs.map((log) => log.profileId);
      const profiles = await prisma.user_game_profiles.findMany({
        where: { id: { in: profileIds } },
        include: {
          users: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { user_achievements: true },
          },
        },
      });

      leaderboard = expLogs.map((log, index) => {
        const profile = profiles.find((p) => p.id === log.profileId);
        return {
          rank: index + 1,
          userId: profile?.users.id || "",
          name: profile?.users.name || "匿名用户",
          avatar: profile?.users.avatar || null,
          level: profile?.level || 1,
          title: profile?.title || "求职新人",
          exp: log._sum.amount || 0,
          achievements: profile?._count.user_achievements || 0,
          isCurrentUser: profile?.users.id === session?.user?.id,
        };
      });
    }

    // 获取当前用户排名
    let currentUserRank: LeaderboardEntry | null = null;
    if (session?.user?.id) {
      const isInLeaderboard = leaderboard.some((entry) => entry.isCurrentUser);

      if (!isInLeaderboard) {
        const userProfile = await prisma.user_game_profiles.findUnique({
          where: { userId: session.user.id },
          include: {
            users: {
              select: { id: true, name: true, avatar: true },
            },
            _count: {
              select: { user_achievements: true },
            },
          },
        });

        if (userProfile) {
          if (type === "alltime") {
            const rank = await prisma.user_game_profiles.count({
              where: {
                OR: [
                  { level: { gt: userProfile.level } },
                  { level: userProfile.level, exp: { gt: userProfile.exp } },
                ],
              },
            });

            currentUserRank = {
              rank: rank + 1,
              userId: userProfile.users.id,
              name: userProfile.users.name || "匿名用户",
              avatar: userProfile.users.avatar,
              level: userProfile.level,
              title: userProfile.title,
              exp: userProfile.exp,
              achievements: userProfile._count.user_achievements,
              isCurrentUser: true,
            };
          } else {
            const periodExp = await prisma.exp_logs.aggregate({
              where: {
                profileId: userProfile.id,
                ...whereClause,
              },
              _sum: { amount: true },
            });

            const rank = await prisma.exp_logs.groupBy({
              by: ["profileId"],
              where: whereClause,
              _sum: { amount: true },
              having: { amount: { _sum: { gt: periodExp._sum.amount || 0 } } },
            });

            currentUserRank = {
              rank: rank.length + 1,
              userId: userProfile.users.id,
              name: userProfile.users.name || "匿名用户",
              avatar: userProfile.users.avatar,
              level: userProfile.level,
              title: userProfile.title,
              exp: periodExp._sum.amount || 0,
              achievements: userProfile._count.user_achievements,
              isCurrentUser: true,
            };
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      currentUserRank,
      type,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("获取排行榜失败:", error);
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    );
  }
}
