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
      const profiles = await prisma.userGameProfile.findMany({
        orderBy: [{ level: "desc" }, { exp: "desc" }],
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { achievements: true },
          },
        },
      });

      leaderboard = profiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.user.id,
        name: profile.user.name || "匿名用户",
        avatar: profile.user.avatar,
        level: profile.level,
        title: profile.title,
        exp: profile.exp,
        achievements: profile._count.achievements,
        isCurrentUser: profile.user.id === session?.user?.id,
      }));
    } else {
      const expLogs = await prisma.expLog.groupBy({
        by: ["profileId"],
        where: whereClause,
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });

      const profileIds = expLogs.map((log) => log.profileId);
      const profiles = await prisma.userGameProfile.findMany({
        where: { id: { in: profileIds } },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { achievements: true },
          },
        },
      });

      leaderboard = expLogs.map((log, index) => {
        const profile = profiles.find((p) => p.id === log.profileId);
        return {
          rank: index + 1,
          userId: profile?.user.id || "",
          name: profile?.user.name || "匿名用户",
          avatar: profile?.user.avatar || null,
          level: profile?.level || 1,
          title: profile?.title || "求职新人",
          exp: log._sum.amount || 0,
          achievements: profile?._count.achievements || 0,
          isCurrentUser: profile?.user.id === session?.user?.id,
        };
      });
    }

    // 获取当前用户排名
    let currentUserRank: LeaderboardEntry | null = null;
    if (session?.user?.id) {
      const isInLeaderboard = leaderboard.some((entry) => entry.isCurrentUser);

      if (!isInLeaderboard) {
        const userProfile = await prisma.userGameProfile.findUnique({
          where: { userId: session.user.id },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            _count: {
              select: { achievements: true },
            },
          },
        });

        if (userProfile) {
          if (type === "alltime") {
            const rank = await prisma.userGameProfile.count({
              where: {
                OR: [
                  { level: { gt: userProfile.level } },
                  { level: userProfile.level, exp: { gt: userProfile.exp } },
                ],
              },
            });

            currentUserRank = {
              rank: rank + 1,
              userId: userProfile.user.id,
              name: userProfile.user.name || "匿名用户",
              avatar: userProfile.user.avatar,
              level: userProfile.level,
              title: userProfile.title,
              exp: userProfile.exp,
              achievements: userProfile._count.achievements,
              isCurrentUser: true,
            };
          } else {
            const periodExp = await prisma.expLog.aggregate({
              where: {
                profileId: userProfile.id,
                ...whereClause,
              },
              _sum: { amount: true },
            });

            const rank = await prisma.expLog.groupBy({
              by: ["profileId"],
              where: whereClause,
              _sum: { amount: true },
              having: { amount: { _sum: { gt: periodExp._sum.amount || 0 } } },
            });

            currentUserRank = {
              rank: rank.length + 1,
              userId: userProfile.user.id,
              name: userProfile.user.name || "匿名用户",
              avatar: userProfile.user.avatar,
              level: userProfile.level,
              title: userProfile.title,
              exp: periodExp._sum.amount || 0,
              achievements: userProfile._count.achievements,
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
