import { prisma } from "@/lib/prisma";
import { CHECKIN_REWARDS } from "./config";
import { addExp } from "./exp-system";

export interface CheckinResult {
  success: boolean;
  isCheckedIn: boolean;
  streak: number;
  expReward: number;
  coinReward: number;
  bonusMessage?: string;
  message: string;
}

/**
 * 执行每日签到
 */
export async function doCheckin(userId: string): Promise<CheckinResult> {
  try {
    const profile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return {
        success: false,
        isCheckedIn: false,
        streak: 0,
        expReward: 0,
        coinReward: 0,
        message: "用户档案不存在",
      };
    }

    // 检查今天是否已签到
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckin = await prisma.dailyCheckin.findUnique({
      where: {
        profileId_checkinDate: {
          profileId: profile.id,
          checkinDate: today,
        },
      },
    });

    if (existingCheckin) {
      return {
        success: false,
        isCheckedIn: true,
        streak: profile.loginStreak,
        expReward: 0,
        coinReward: 0,
        message: "今天已经签到过了",
      };
    }

    // 计算连续签到天数
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckin = await prisma.dailyCheckin.findUnique({
      where: {
        profileId_checkinDate: {
          profileId: profile.id,
          checkinDate: yesterday,
        },
      },
    });

    const isConsecutive = !!yesterdayCheckin;
    const newStreak = isConsecutive ? profile.loginStreak + 1 : 1;

    // 计算奖励
    let expReward = CHECKIN_REWARDS.baseExp;
    let coinReward = CHECKIN_REWARDS.baseCoins;
    let bonusMessage: string | undefined;

    // 检查连续签到奖励
    const milestone = Object.keys(CHECKIN_REWARDS.consecutiveBonus)
      .map(Number)
      .sort((a, b) => b - a)
      .find(days => newStreak >= days);

    if (milestone) {
      const bonus = CHECKIN_REWARDS.consecutiveBonus[milestone as keyof typeof CHECKIN_REWARDS.consecutiveBonus];
      expReward = bonus.exp;
      coinReward = bonus.coins;
      bonusMessage = bonus.message;
    }

    // 执行签到
    await prisma.$transaction([
      // 创建签到记录
      prisma.dailyCheckin.create({
        data: {
          profileId: profile.id,
          checkinDate: today,
          expReward,
          coinReward,
          isConsecutive,
        },
      }),
      // 更新用户档案
      prisma.userGameProfile.update({
        where: { userId },
        data: {
          loginStreak: newStreak,
          coins: { increment: coinReward },
        },
      }),
    ]);

    // 添加经验值
    await addExp(userId, "CHECKIN", `连续签到 ${newStreak} 天`);

    return {
      success: true,
      isCheckedIn: false,
      streak: newStreak,
      expReward,
      coinReward,
      bonusMessage,
      message: bonusMessage || `签到成功！+${expReward} 经验 +${coinReward} 金币`,
    };
  } catch (error) {
    console.error("签到失败:", error);
    return {
      success: false,
      isCheckedIn: false,
      streak: 0,
      expReward: 0,
      coinReward: 0,
      message: "签到失败",
    };
  }
}

/**
 * 检查今日签到状态
 */
export async function getCheckinStatus(userId: string) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
    select: { id: true, loginStreak: true },
  });

  if (!profile) {
    return {
      isCheckedIn: false,
      streak: 0,
      todayReward: CHECKIN_REWARDS.baseExp,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCheckin = await prisma.dailyCheckin.findUnique({
    where: {
      profileId_checkinDate: {
        profileId: profile.id,
        checkinDate: today,
      },
    },
  });

  // 计算今日奖励
  let todayReward = CHECKIN_REWARDS.baseExp;
  const milestone = Object.keys(CHECKIN_REWARDS.consecutiveBonus)
    .map(Number)
    .sort((a, b) => b - a)
    .find(days => profile.loginStreak + (todayCheckin ? 0 : 1) >= days);

  if (milestone) {
    const bonus = CHECKIN_REWARDS.consecutiveBonus[milestone as keyof typeof CHECKIN_REWARDS.consecutiveBonus];
    todayReward = bonus.exp;
  }

  return {
    isCheckedIn: !!todayCheckin,
    streak: profile.loginStreak,
    todayReward,
  };
}

/**
 * 获取签到历史
 */
export async function getCheckinHistory(userId: string, days: number = 30) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const checkins = await prisma.dailyCheckin.findMany({
    where: {
      profileId: profile.id,
      checkinDate: { gte: startDate },
    },
    orderBy: { checkinDate: "desc" },
  });

  return checkins.map(c => ({
    date: c.checkinDate,
    expReward: c.expReward,
    coinReward: c.coinReward,
    isConsecutive: c.isConsecutive,
  }));
}

/**
 * 获取签到日历数据 (用于UI展示)
 */
export async function getCheckinCalendar(userId: string, year: number, month: number) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) return [];

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const checkins = await prisma.dailyCheckin.findMany({
    where: {
      profileId: profile.id,
      checkinDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { checkinDate: true },
  });

  return checkins.map(c => c.checkinDate.getDate());
}
