import { prisma } from "@/lib/prisma";
import { addExp } from "./exp-system";

// 成就条件类型
interface AchievementCondition {
  count?: number;
  days?: number;
  type?: string;
}

/**
 * 检查并解锁成就
 */
export async function checkAndUnlockAchievements(userId: string) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
    include: {
      achievements: {
        include: { achievement: true },
      },
    },
  });

  if (!profile) return;

  const unlockedCodes = new Set(profile.achievements.map(a => a.achievement.code));
  const newUnlocks = [];

  // 获取所有成就定义
  const allAchievements = await prisma.achievement.findMany();

  for (const achievement of allAchievements) {
    // 跳过已解锁的
    if (unlockedCodes.has(achievement.code)) continue;

    // 检查条件
    const condition = achievement.condition as AchievementCondition;
    const shouldUnlock = await checkAchievementCondition(userId, achievement.code, condition);

    if (shouldUnlock) {
      // 解锁成就
      await prisma.userAchievement.create({
        data: {
          profileId: profile.id,
          achievementId: achievement.id,
        },
      });

      // 奖励经验
      await addExp(userId, "ACHIEVEMENT", `解锁成就: ${achievement.name}`);

      newUnlocks.push(achievement);
    }
  }

  return newUnlocks;
}

/**
 * 检查单个成就条件
 */
async function checkAchievementCondition(
  userId: string,
  code: string,
  // // // // _condition: AchievementCondition
): Promise<boolean> {
  switch (code) {
    // === 基础成就 ===
    case "FIRST_LOGIN":
      // 首次登录 - 创建档案即算
      return true;

    case "COMPLETE_PROFILE": {
      // 完善资料
      const profile = await prisma.user_profiles.findUnique({
        where: { userId },
      });
      return !!(
        profile?.bio &&
        profile.bio.length > 10 &&
        profile.skills?.length > 0
      );
    }

    case "LOGIN_STREAK_7": {
      // 连续登录7天
      const gameProfile = await prisma.userGameProfile.findUnique({
        where: { userId },
      });
      return (gameProfile?.loginStreak || 0) >= 7;
    }

    case "LOGIN_STREAK_30": {
      // 连续登录30天
      const gp = await prisma.userGameProfile.findUnique({
        where: { userId },
      });
      return (gp?.loginStreak || 0) >= 30;
    }

    // === 浏览成就 ===
    case "FIRST_VIEW": {
      // 首次浏览职位
      const firstView = await prisma.expLog.findFirst({
        where: { profile: { userId }, type: "VIEW_JOB" },
      });
      return !!firstView;
    }

    case "VIEW_JOBS_10": {
      // 浏览10个职位
      const viewCount10 = await prisma.expLog.count({
        where: { profile: { userId }, type: "VIEW_JOB" },
      });
      return viewCount10 >= 10;
    }

    case "VIEW_JOBS_100": {
      // 浏览100个职位
      const viewCount100 = await prisma.expLog.count({
        where: { profile: { userId }, type: "VIEW_JOB" },
      });
      return viewCount100 >= 100;
    }

    // === 投递成就 ===
    case "FIRST_APPLY": {
      // 首次投递
      const firstApply = await prisma.job_applications.findFirst({
        where: { userId },
      });
      return !!firstApply;
    }

    case "APPLY_JOBS_10": {
      // 投递10个职位
      const applyCount10 = await prisma.job_applications.count({
        where: { userId },
      });
      return applyCount10 >= 10;
    }

    case "APPLY_JOBS_50": {
      // 投递50个职位
      const applyCount50 = await prisma.job_applications.count({
        where: { userId },
      });
      return applyCount50 >= 50;
    }

    // === 面试成就 ===
    case "FIRST_INTERVIEW": {
      // 首次面试邀请
      const firstInterview = await prisma.job_applications.findFirst({
        where: { userId, status: "INTERVIEW" },
      });
      return !!firstInterview;
    }

    case "INTERVIEWS_10": {
      // 10次面试邀请
      const interviewCount = await prisma.job_applications.count({
        where: { userId, status: "INTERVIEW" },
      });
      return interviewCount >= 10;
    }

    // === Offer成就 ===
    case "FIRST_OFFER": {
      // 首次录用
      const firstOffer = await prisma.job_applications.findFirst({
        where: { userId, status: "OFFER" },
      });
      return !!firstOffer;
    }

    case "OFFERS_5": {
      // 5个录用
      const offerCount = await prisma.job_applications.count({
        where: { userId, status: "OFFER" },
      });
      return offerCount >= 5;
    }

    // === 社区成就 ===
    case "READ_ARTICLES_10": {
      // 阅读10篇文章
      const readCount10 = await prisma.expLog.count({
        where: { profile: { userId }, type: "READ_ARTICLE" },
      });
      return readCount10 >= 10;
    }

    case "READ_ARTICLES_50": {
      // 阅读50篇文章
      const readCount50 = await prisma.expLog.count({
        where: { profile: { userId }, type: "READ_ARTICLE" },
      });
      return readCount50 >= 50;
    }

    default:
      return false;
  }
}
