import { prisma } from "@/lib/prisma";
import {
  EXP_CONFIG,
  ExpType,
  calculateLevel,
  getTitleForLevel,
  ACHIEVEMENTS,
  TASKS,
} from "./config";
import { checkAndUnlockAchievements } from "./achievement-system";

// ==================== 经验值管理 ====================

interface AddExpResult {
  success: boolean;
  addedExp: number;
  newLevel?: {
    level: number;
    title: string;
    icon: string;
  };
  isLevelUp: boolean;
  message: string;
}

/**
 * 为用户添加经验值
 * @param userId 用户ID
 * @param type 经验值类型
 * @param description 描述
 * @param relatedId 关联记录ID（可选）
 */
export async function addExp(
  userId: string,
  type: ExpType,
  description?: string,
  relatedId?: string
): Promise<AddExpResult> {
  try {
    const config = EXP_CONFIG[type];
    if (!config) {
      return {
        success: false,
        addedExp: 0,
        isLevelUp: false,
        message: "未知的经验值类型",
      };
    }

    // 检查是否超过每日上限
    if (config.maxPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayExp = await prisma.expLog.aggregate({
        where: {
          profile: { userId },
          type: type as any, // 类型转换
          createdAt: { gte: today },
        },
        _sum: { amount: true },
      });

      const todayTotal = todayExp._sum.amount || 0;
      if (todayTotal >= config.maxPerDay) {
        return {
          success: false,
          addedExp: 0,
          isLevelUp: false,
          message: "今日已达上限",
        };
      }
    }

    // 检查冷却时间
    if (config.cooldown && config.cooldown > 0) {
      const lastExp = await prisma.expLog.findFirst({
        where: {
          profile: { userId },
          type: type as any, // 类型转换
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastExp) {
        const timeDiff = Date.now() - lastExp.createdAt.getTime();
        if (timeDiff < config.cooldown * 1000) {
          return {
            success: false,
            addedExp: 0,
            isLevelUp: false,
            message: "冷却中",
          };
        }
      }
    }

    // 获取用户当前游戏档案
    let profile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    // 如果没有档案，创建一个
    if (!profile) {
      profile = await prisma.userGameProfile.create({
        data: {
          userId,
          level: 1,
          exp: 0,
          nextLevelExp: 100,
        },
      });
    }

    const oldLevel = profile.level;
    const newTotalExp = profile.exp + config.exp;
    const levelInfo = calculateLevel(newTotalExp);

    // 更新用户档案
    const titleInfo = getTitleForLevel(levelInfo.level);
    
    await prisma.$transaction([
      // 更新档案
      prisma.userGameProfile.update({
        where: { userId },
        data: {
          exp: newTotalExp,
          level: levelInfo.level,
          nextLevelExp: levelInfo.nextLevelExp,
          title: titleInfo.title,
        },
      }),
      // 记录经验日志
      prisma.expLog.create({
        data: {
          profileId: profile.id,
          amount: config.exp,
          type: type as any, // 类型转换
          description: description || config.description,
          relatedId,
        },
      }),
    ]);

    // 检查是否升级
    const isLevelUp = levelInfo.level > oldLevel;
    
    // 异步检查成就解锁（不阻塞返回）
    checkAndUnlockAchievements(userId).catch(console.error);

    return {
      success: true,
      addedExp: config.exp,
      newLevel: isLevelUp ? {
        level: levelInfo.level,
        title: titleInfo.title,
        icon: titleInfo.icon,
      } : undefined,
      isLevelUp,
      message: isLevelUp 
        ? `恭喜升级！你现在是 Lv.${levelInfo.level} ${titleInfo.title}` 
        : `+${config.exp} 经验值`,
    };
  } catch (error) {
    console.error("添加经验值失败:", error);
    return {
      success: false,
      addedExp: 0,
      isLevelUp: false,
      message: "添加经验值失败",
    };
  }
}

/**
 * 获取用户游戏档案
 */
export async function getGameProfile(userId: string) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          achievements: true,
        },
      },
    },
  });

  if (!profile) {
    // 自动创建档案
    return createGameProfile(userId);
  }

  const levelInfo = calculateLevel(profile.exp);
  const titleInfo = getTitleForLevel(profile.level);

  return {
    ...profile,
    progressPercent: Math.min(
      100,
      Math.floor((levelInfo.currentExp / levelInfo.nextLevelExp) * 100)
    ),
    titleInfo,
  };
}

/**
 * 创建用户游戏档案
 */
export async function createGameProfile(userId: string) {
  const profile = await prisma.userGameProfile.create({
    data: {
      userId,
      level: 1,
      exp: 0,
      nextLevelExp: 100,
      coins: 100, // 初始金币
      title: "求职新人",
    },
    include: {
      _count: {
        select: {
          achievements: true,
        },
      },
    },
  });

  // 创建新手任务
  await initializeTasks(profile.id);
  
  // 创建今日每日任务
  await createDailyTasks(profile.id);

  return {
    ...profile,
    progressPercent: 0,
    titleInfo: getTitleForLevel(1),
  };
}

// ==================== 任务系统 ====================

/**
 * 初始化用户任务
 */
export async function initializeTasks(profileId: string) {
  // 检查是否已初始化
  const existingCount = await prisma.taskProgress.count({
    where: { profileId },
  });

  if (existingCount > 0) return;

  // 创建所有活跃任务
  const activeTasks = TASKS.filter(t => 
    t.category === "GUIDE" // 只创建引导任务
  );

  await prisma.taskProgress.createMany({
    data: activeTasks.map(task => ({
      profileId,
      taskId: task.code, // 使用code作为ID
      status: "PENDING" as const,
      target: (task.condition as { count?: number }).count || 1,
    })),
  });
}

/**
 * 创建今日每日任务
 * 如果今天已创建过，则不再创建
 */
export async function createDailyTasks(profileId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取每日任务定义
  const dailyTaskDefs = await prisma.taskDefinition.findMany({
    where: {
      category: "DAILY",
    },
  });

  // 检查每个每日任务今天是否已创建
  for (const taskDef of dailyTaskDefs) {
    const existingTask = await prisma.taskProgress.findFirst({
      where: {
        profileId,
        taskId: taskDef.id,
        startedAt: {
          gte: today,
        },
      },
    });

    // 今天已创建，跳过
    if (existingTask) continue;

    // 创建今日每日任务
    await prisma.taskProgress.create({
      data: {
        profileId,
        taskId: taskDef.id,
        status: "PENDING",
        target: (taskDef.condition as { count?: number })?.count || 1,
      },
    });
  }
}

/**
 * 重置每日任务
 * 用于每日首次登录时调用
 */
export async function resetDailyTasks(userId: string) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
  });

  if (!profile) return;

  await createDailyTasks(profile.id);
}

/**
 * 更新任务进度
 */
export async function updateTaskProgress(
  userId: string,
  taskCode: string,
  progressDelta: number = 1
) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
  });

  if (!profile) return;

  const taskProgress = await prisma.taskProgress.findUnique({
    where: {
      profileId_taskId: {
        profileId: profile.id,
        taskId: taskCode,
      },
    },
    include: { task: true },
  });

  if (!taskProgress || taskProgress.status === "COMPLETED") return;

  const newProgress = Math.min(
    taskProgress.target,
    taskProgress.progress + progressDelta
  );
  const isCompleted = newProgress >= taskProgress.target;

  await prisma.taskProgress.update({
    where: { id: taskProgress.id },
    data: {
      progress: newProgress,
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // 如果完成任务，给予奖励
  if (isCompleted && taskProgress.task) {
    await addExp(userId, "COMPLETE_TASK", `完成任务: ${taskProgress.task.name}`);
  }
}

// ==================== 成就系统 ====================

// 成就检查逻辑已移至 achievement-system.ts
// import { checkAndUnlockAchievements } from "./achievement-system";

/**
 * 检查成就是否满足条件
 */
async function checkAchievementCondition(userId: string, condition: any): Promise<boolean> {
  // 根据条件类型检查
  switch (condition.type) {
    case "login":
      // 检查登录次数
      const loginCount = await prisma.userGameProfile.findUnique({
        where: { userId },
        select: { loginStreak: true },
      });
      return (loginCount?.loginStreak || 0) >= (condition.count || 1);

    case "complete_profile":
      // 检查是否完善档案
      const userProfile = await prisma.user_profiles.findUnique({
        where: { userId },
      });
      return !!userProfile && !!userProfile.bio && userProfile.skills.length > 0;

    case "view_job":
      // 检查浏览职位数量
      const viewCount = await prisma.page_views.count({
        where: { 
          userId,
          path: { startsWith: "/jobs/" },
        },
      });
      return viewCount >= (condition.count || 1);

    case "apply_job":
      // 检查申请数量
      const applyCount = await prisma.job_applications.count({
        where: { userId },
      });
      return applyCount >= (condition.count || 1);

    case "interview":
      // 检查面试次数 (通过申请状态)
      const interviewCount = await prisma.job_applications.count({
        where: { 
          userId,
          status: { in: ["INTERVIEW", "OFFER"] },
        },
      });
      return interviewCount >= (condition.count || 1);

    case "offer":
      // 检查Offer数量
      const offerCount = await prisma.job_applications.count({
        where: { 
          userId,
          status: "OFFER",
        },
      });
      return offerCount >= (condition.count || 1);

    case "login_streak":
      // 检查连续登录天数
      const streak = await prisma.userGameProfile.findUnique({
        where: { userId },
        select: { loginStreak: true },
      });
      return (streak?.loginStreak || 0) >= (condition.days || 7);

    default:
      return false;
  }
}

// ==================== 统计更新 ====================

/**
 * 更新用户统计
 */
export async function updateUserStats(
  userId: string,
  statsUpdate: Partial<{
    jobsViewed: number;
    jobsApplied: number;
    interviews: number;
    offers: number;
  }>
) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
  });

  if (!profile) return;

  const currentStats = (profile.stats as any) || {};
  
  await prisma.userGameProfile.update({
    where: { userId },
    data: {
      stats: {
        ...currentStats,
        ...statsUpdate,
      },
    },
  });

  // 检查成就
  await checkAndUnlockAchievements(userId);
}

// ==================== 便捷函数 ====================

/**
 * 记录职位浏览
 */
export async function trackJobView(userId: string, jobId: string) {
  await Promise.all([
    addExp(userId, "VIEW_JOB", "浏览职位", jobId),
    updateTaskProgress(userId, "GUIDE_VIEW_JOBS"),
    updateTaskProgress(userId, "DAILY_VIEW_JOBS"),
  ]);
}

/**
 * 记录职位申请
 */
export async function trackJobApply(userId: string, jobId: string) {
  await Promise.all([
    addExp(userId, "APPLY_JOB", "申请职位", jobId),
    updateTaskProgress(userId, "GUIDE_FIRST_APPLY"),
  ]);
}

/**
 * 记录登录
 */
export async function trackLogin(userId: string) {
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    await createGameProfile(userId);
    return;
  }

  // 检查是否连续登录
  const lastLogin = profile.lastLoginAt;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastLoginDay = new Date(lastLogin);
  lastLoginDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor(
    (today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = profile.loginStreak;
  if (dayDiff === 1) {
    // 连续登录
    newStreak += 1;
  } else if (dayDiff > 1) {
    // 断开了，重新计算
    newStreak = 1;
  }

  await prisma.userGameProfile.update({
    where: { userId },
    data: {
      lastLoginAt: new Date(),
      loginStreak: newStreak,
    },
  });

  // 重置每日任务（每天首次登录时创建新的）
  await resetDailyTasks(userId);

  // 添加登录经验
  await addExp(userId, "LOGIN", "每日登录");
  
  // 更新每日任务
  await updateTaskProgress(userId, "DAILY_LOGIN");
  
  // 检查成就
  await checkAndUnlockAchievements(userId);
}
