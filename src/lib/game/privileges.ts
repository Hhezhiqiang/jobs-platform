/**
 * 等级特权系统配置
 * 定义每个等级解锁的特权和功能
 */

export interface LevelPrivilege {
  level: number;
  title: string;
  privileges: string[];
  benefits: {
    resumePriority?: number; // 简历优先展示等级 (1-5)
    dailyApplyLimit?: number; // 每日申请上限
    maxSavedJobs?: number; // 最大收藏职位数
    canViewAnalytics?: boolean; // 查看申请数据分析
    canUseTemplates?: boolean; // 使用简历模板
    canPriorityApply?: boolean; // 优先申请通道
    customBadge?: string; // 自定义徽章
  };
}

/**
 * 等级特权配置表
 */
export const LEVEL_PRIVILEGES: LevelPrivilege[] = [
  {
    level: 1,
    title: "求职新人",
    privileges: ["基础求职功能", "每日签到奖励"],
    benefits: {
      resumePriority: 1,
      dailyApplyLimit: 5,
      maxSavedJobs: 10,
      canViewAnalytics: false,
      canUseTemplates: false,
      canPriorityApply: false,
    },
  },
  {
    level: 2,
    title: "实习生",
    privileges: ["简历模板库（基础）", "申请记录分析"],
    benefits: {
      resumePriority: 1,
      dailyApplyLimit: 8,
      maxSavedJobs: 20,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: false,
    },
  },
  {
    level: 3,
    title: "职场新秀",
    privileges: ["简历优先展示", "收藏上限提升"],
    benefits: {
      resumePriority: 2,
      dailyApplyLimit: 10,
      maxSavedJobs: 30,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: false,
    },
  },
  {
    level: 5,
    title: "初级求职者",
    privileges: ["每日申请上限+3", "专属求职顾问"],
    benefits: {
      resumePriority: 2,
      dailyApplyLimit: 13,
      maxSavedJobs: 40,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: false,
    },
  },
  {
    level: 8,
    title: "中级求职者",
    privileges: ["优先申请通道", "简历模板库（高级）"],
    benefits: {
      resumePriority: 3,
      dailyApplyLimit: 15,
      maxSavedJobs: 50,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: true,
    },
  },
  {
    level: 10,
    title: "高级求职者",
    privileges: ["简历高亮展示", "面试快速通道"],
    benefits: {
      resumePriority: 4,
      dailyApplyLimit: 20,
      maxSavedJobs: 80,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: true,
      customBadge: "🏅",
    },
  },
  {
    level: 15,
    title: "求职专家",
    privileges: ["无限申请次数", "一对一职业规划"],
    benefits: {
      resumePriority: 5,
      dailyApplyLimit: 999,
      maxSavedJobs: 150,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: true,
      customBadge: "🎖️",
    },
  },
  {
    level: 20,
    title: "求职大师",
    privileges: ["企业HR直连", "专属内推机会"],
    benefits: {
      resumePriority: 5,
      dailyApplyLimit: 999,
      maxSavedJobs: 200,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: true,
      customBadge: "👑",
    },
  },
  {
    level: 30,
    title: "传奇求职者",
    privileges: ["全站最高荣誉", "终身VIP权益"],
    benefits: {
      resumePriority: 5,
      dailyApplyLimit: 999,
      maxSavedJobs: 500,
      canViewAnalytics: true,
      canUseTemplates: true,
      canPriorityApply: true,
      customBadge: "👑",
    },
  },
];

/**
 * 获取指定等级的特权信息
 */
export function getLevelPrivilege(level: number): LevelPrivilege {
  const privilege = LEVEL_PRIVILEGES.find((p) => p.level === level);
  if (privilege) return privilege;

  // 如果没有精确匹配，找最近的低等级
  const lowerPrivileges = LEVEL_PRIVILEGES.filter((p) => p.level < level);
  if (lowerPrivileges.length > 0) {
    return lowerPrivileges[lowerPrivileges.length - 1];
  }

  // 默认返回等级1
  return LEVEL_PRIVILEGES[0];
}

/**
 * 获取当前等级相比上一级的提升
 */
export function getLevelUpBenefits(
  oldLevel: number,
  newLevel: number
): string[] {
  const oldPrivilege = getLevelPrivilege(oldLevel);
  const newPrivilege = getLevelPrivilege(newLevel);

  const benefits: string[] = [];

  // 对比特权
  newPrivilege.privileges.forEach((privilege) => {
    if (!oldPrivilege.privileges.includes(privilege)) {
      benefits.push(privilege);
    }
  });

  // 对比数值提升
  const newResumePriority = newPrivilege.benefits.resumePriority ?? 0;
  const oldResumePriority = oldPrivilege.benefits.resumePriority ?? 0;
  if (newResumePriority > oldResumePriority) {
    benefits.push(`简历优先级提升至 ${newResumePriority} 级`);
  }

  const newDailyApplyLimit = newPrivilege.benefits.dailyApplyLimit ?? 0;
  const oldDailyApplyLimit = oldPrivilege.benefits.dailyApplyLimit ?? 0;
  if (newDailyApplyLimit > oldDailyApplyLimit) {
    benefits.push(`每日申请上限提升至 ${newDailyApplyLimit} 次`);
  }

  const newMaxSavedJobs = newPrivilege.benefits.maxSavedJobs ?? 0;
  const oldMaxSavedJobs = oldPrivilege.benefits.maxSavedJobs ?? 0;
  if (newMaxSavedJobs > oldMaxSavedJobs) {
    benefits.push(`收藏上限提升至 ${newMaxSavedJobs} 个`);
  }

  if (newPrivilege.benefits.canPriorityApply && !oldPrivilege.benefits.canPriorityApply) {
    benefits.push("解锁优先申请通道");
  }

  if (newPrivilege.benefits.customBadge && !oldPrivilege.benefits.customBadge) {
    benefits.push(`获得专属徽章 ${newPrivilege.benefits.customBadge}`);
  }

  return benefits;
}

/**
 * 获取等级进度信息
 */
export function getLevelProgress(exp: number): {
  currentLevel: number;
  currentExp: number;
  expForNextLevel: number;
  progress: number;
} {
  const levelInfo = calculateLevel(exp);
  const prevLevelExp = levelInfo.level > 1 
    ? Math.floor(100 * Math.pow(1.15, levelInfo.level - 2))
    : 0;
  const expInCurrentLevel = exp - prevLevelExp;
  const expNeeded = levelInfo.nextLevelExp - prevLevelExp;
  const progress = Math.min(100, Math.floor((expInCurrentLevel / expNeeded) * 100));

  return {
    currentLevel: levelInfo.level,
    currentExp: expInCurrentLevel,
    expForNextLevel: expNeeded,
    progress,
  };
}

/**
 * 计算等级（复用自config.ts）
 */
function calculateLevel(exp: number): {
  level: number;
  nextLevelExp: number;
} {
  let level = 1;
  let nextLevelExp = 100;
  let accumulatedExp = 0;

  while (accumulatedExp + nextLevelExp <= exp && level < 50) {
    accumulatedExp += nextLevelExp;
    level++;
    nextLevelExp = Math.floor(100 * Math.pow(1.15, level - 1));
  }

  return { level, nextLevelExp: accumulatedExp + nextLevelExp };
}

/**
 * 特权说明文本
 */
export const PRIVILEGE_DESCRIPTIONS: Record<keyof LevelPrivilege["benefits"], string> = {
  resumePriority: "简历优先展示等级",
  dailyApplyLimit: "每日可申请职位上限",
  maxSavedJobs: "最大收藏职位数量",
  canViewAnalytics: "申请数据分析功能",
  canUseTemplates: "简历模板使用权限",
  canPriorityApply: "优先申请通道权限",
  customBadge: "专属等级徽章",
};
