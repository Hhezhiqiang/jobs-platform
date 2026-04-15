// 游戏化系统配置
// 定义经验值规则、等级系统、成就和任务

export const EXP_CONFIG = {
  // 基础行为 - 浏览职位
  VIEW_JOB: { 
    exp: 2, 
    maxPerDay: 50, 
    description: "浏览职位",
    cooldown: 0 // 冷却时间(秒)
  },
  
  // 申请职位
  APPLY_JOB: { 
    exp: 20, 
    maxPerDay: null, 
    description: "申请职位",
    cooldown: 0
  },
  
  // 每日登录
  LOGIN: { 
    exp: 5, 
    maxPerDay: 5, 
    description: "每日登录",
    cooldown: 86400 // 24小时
  },
  
  // 完善档案
  COMPLETE_PROFILE: { 
    exp: 50, 
    maxPerDay: null, 
    description: "完善个人档案",
    cooldown: 0
  },
  
  // 上传简历
  UPLOAD_RESUME: {
    exp: 30,
    maxPerDay: null,
    description: "上传简历",
    cooldown: 0
  },
  
  // 社区行为 - 发布话题
  POST_TOPIC: { 
    exp: 15, 
    maxPerDay: 50, 
    description: "发布话题",
    cooldown: 60 // 1分钟防刷
  },
  
  // 回复话题
  REPLY_TOPIC: { 
    exp: 8, 
    maxPerDay: 30, 
    description: "回复话题",
    cooldown: 30
  },
  
  // 获得点赞
  GET_LIKE: { 
    exp: 3, 
    maxPerDay: 100, 
    description: "获得点赞",
    cooldown: 0
  },
  
  // 学习行为 - 阅读文章
  READ_ARTICLE: { 
    exp: 3, 
    maxPerDay: 30, 
    description: "阅读文章",
    cooldown: 0
  },
  
  // 完成试炼
  COMPLETE_TRIAL: { 
    exp: 100, 
    maxPerDay: null, 
    description: "完成试炼挑战",
    cooldown: 0
  },
  
  // 完成面试
  COMPLETE_INTERVIEW: {
    exp: 50,
    maxPerDay: null,
    description: "完成面试",
    cooldown: 0
  },
  
  // 获得Offer
  RECEIVE_OFFER: {
    exp: 200,
    maxPerDay: null,
    description: "获得Offer",
    cooldown: 0
  },
  
  // 每日签到
  CHECKIN: {
    exp: 10,
    maxPerDay: 10,
    description: "每日签到",
    cooldown: 86400
  },
  
  // 完成任务
  COMPLETE_TASK: {
    exp: 20,
    maxPerDay: null,
    description: "完成任务",
    cooldown: 0
  },
  
  // 解锁成就
  ACHIEVEMENT: {
    exp: 50,
    maxPerDay: null,
    description: "解锁成就",
    cooldown: 0
  },
} as const;

export type ExpType = keyof typeof EXP_CONFIG;

// 等级系统配置
export const LEVEL_CONFIG = {
  maxLevel: 50,
  baseExp: 100,
  growthRate: 1.15, // 每级经验需求增长15%
  
  // 等级称号
  titles: [
    { level: 1, title: "求职新人", icon: "🌱" },
    { level: 5, title: "初级求职者", icon: "🌿" },
    { level: 10, title: "求职达人", icon: "🌲" },
    { level: 15, title: "面试练习生", icon: "🎯" },
    { level: 20, title: "面试高手", icon: "⚔️" },
    { level: 25, title: "Offer猎人", icon: "🏹" },
    { level: 30, title: "Offer收割机", icon: "🔥" },
    { level: 35, title: "职场精英", icon: "💎" },
    { level: 40, title: "求职专家", icon: "👑" },
    { level: 45, title: "求职大师", icon: "🏆" },
    { level: 50, title: "传奇求职者", icon: "🌟" },
  ],
};

// 计算升到下一级所需经验
export function getExpForLevel(level: number): number {
  if (level >= LEVEL_CONFIG.maxLevel) return Infinity;
  return Math.floor(LEVEL_CONFIG.baseExp * Math.pow(LEVEL_CONFIG.growthRate, level - 1));
}

// 根据经验计算等级
export function calculateLevel(exp: number): { level: number; currentExp: number; nextLevelExp: number } {
  let level = 1;
  let remainingExp = exp;
  
  while (level < LEVEL_CONFIG.maxLevel) {
    const expNeeded = getExpForLevel(level);
    if (remainingExp < expNeeded) {
      break;
    }
    remainingExp -= expNeeded;
    level++;
  }
  
  const nextLevelExp = getExpForLevel(level);
  
  return {
    level,
    currentExp: remainingExp,
    nextLevelExp,
  };
}

// 获取等级称号
export function getTitleForLevel(level: number): { title: string; icon: string } {
  const titleConfig = [...LEVEL_CONFIG.titles]
    .reverse()
    .find(t => level >= t.level);
  
  return titleConfig || LEVEL_CONFIG.titles[0];
}

// 成就定义
export const ACHIEVEMENTS = [
  // 基础成就
  {
    code: "FIRST_LOGIN",
    name: "初次见面",
    description: "首次登录平台",
    icon: "👋",
    category: "BASIC",
    expReward: 20,
    coinReward: 10,
    condition: { type: "login", count: 1 },
  },
  {
    code: "COMPLETE_PROFILE",
    name: "完善自我",
    description: "完善个人档案信息",
    icon: "📝",
    category: "BASIC",
    expReward: 50,
    coinReward: 30,
    condition: { type: "complete_profile" },
  },
  {
    code: "LOGIN_STREAK_7",
    name: "坚持不懈",
    description: "连续登录7天",
    icon: "📅",
    category: "BASIC",
    expReward: 100,
    coinReward: 50,
    condition: { type: "login_streak", days: 7 },
  },
  {
    code: "LOGIN_STREAK_30",
    name: "月度达人",
    description: "连续登录30天",
    icon: "🗓️",
    category: "BASIC",
    expReward: 300,
    coinReward: 150,
    condition: { type: "login_streak", days: 30 },
  },
  
  // 求职成就
  {
    code: "FIRST_VIEW",
    name: "初次探索",
    description: "浏览第一个职位",
    icon: "👀",
    category: "JOB",
    expReward: 10,
    coinReward: 5,
    condition: { type: "view_job", count: 1 },
  },
  {
    code: "VIEW_JOBS_10",
    name: "探索者",
    description: "浏览10个职位",
    icon: "🔍",
    category: "JOB",
    expReward: 30,
    coinReward: 15,
    condition: { type: "view_job", count: 10 },
  },
  {
    code: "VIEW_JOBS_100",
    name: "机会猎人",
    description: "浏览100个职位",
    icon: "🎯",
    category: "JOB",
    expReward: 100,
    coinReward: 50,
    condition: { type: "view_job", count: 100 },
  },
  {
    code: "FIRST_APPLY",
    name: "勇敢迈出第一步",
    description: "提交第一份申请",
    icon: "📨",
    category: "JOB",
    expReward: 50,
    coinReward: 25,
    condition: { type: "apply_job", count: 1 },
  },
  {
    code: "APPLY_JOBS_10",
    name: "积极求职者",
    description: "提交10份申请",
    icon: "📬",
    category: "JOB",
    expReward: 150,
    coinReward: 75,
    condition: { type: "apply_job", count: 10 },
  },
  {
    code: "APPLY_JOBS_50",
    name: "申请达人",
    description: "提交50份申请",
    icon: "📮",
    category: "JOB",
    expReward: 400,
    coinReward: 200,
    condition: { type: "apply_job", count: 50 },
  },
  
  // 面试成就
  {
    code: "FIRST_INTERVIEW",
    name: "面试新手",
    description: "完成第一场面试",
    icon: "🎤",
    category: "INTERVIEW",
    expReward: 100,
    coinReward: 50,
    condition: { type: "interview", count: 1 },
  },
  {
    code: "INTERVIEWS_10",
    name: "面试老手",
    description: "完成10场面试",
    icon: "🎙️",
    category: "INTERVIEW",
    expReward: 300,
    coinReward: 150,
    condition: { type: "interview", count: 10 },
  },
  {
    code: "FIRST_OFFER",
    name: "梦想成真",
    description: "获得第一个Offer",
    icon: "🎉",
    category: "INTERVIEW",
    expReward: 500,
    coinReward: 250,
    condition: { type: "offer", count: 1 },
  },
  {
    code: "OFFERS_5",
    name: "Offer收割机",
    description: "获得5个Offer",
    icon: "🏆",
    category: "INTERVIEW",
    expReward: 1500,
    coinReward: 750,
    condition: { type: "offer", count: 5 },
  },
  
  // 社区成就
  {
    code: "FIRST_POST",
    name: "社区新人",
    description: "发布第一个话题",
    icon: "💬",
    category: "SOCIAL",
    expReward: 30,
    coinReward: 15,
    condition: { type: "post_topic", count: 1 },
  },
  {
    code: "POSTS_10",
    name: "活跃分子",
    description: "发布10个话题",
    icon: "📢",
    category: "SOCIAL",
    expReward: 100,
    coinReward: 50,
    condition: { type: "post_topic", count: 10 },
  },
  {
    code: "FIRST_REPLY",
    name: "乐于助人",
    description: "首次回复他人话题",
    icon: "💡",
    category: "SOCIAL",
    expReward: 20,
    coinReward: 10,
    condition: { type: "reply_topic", count: 1 },
  },
  {
    code: "REPLIES_20",
    name: "热心肠",
    description: "回复20个话题",
    icon: "🤝",
    category: "SOCIAL",
    expReward: 80,
    coinReward: 40,
    condition: { type: "reply_topic", count: 20 },
  },
  {
    code: "GET_LIKES_50",
    name: "人气王",
    description: "获得50个点赞",
    icon: "❤️",
    category: "SOCIAL",
    expReward: 100,
    coinReward: 50,
    condition: { type: "get_like", count: 50 },
  },
  
  // 学习成就
  {
    code: "READ_ARTICLES_10",
    name: "好学之人",
    description: "阅读10篇文章",
    icon: "📚",
    category: "LEARNING",
    expReward: 40,
    coinReward: 20,
    condition: { type: "read_article", count: 10 },
  },
  {
    code: "READ_ARTICLES_50",
    name: "知识渊博",
    description: "阅读50篇文章",
    icon: "🎓",
    category: "LEARNING",
    expReward: 200,
    coinReward: 100,
    condition: { type: "read_article", count: 50 },
  },
  {
    code: "COMPLETE_TRIAL",
    name: "试炼通关",
    description: "完成一次试炼挑战",
    icon: "⚔️",
    category: "LEARNING",
    expReward: 150,
    coinReward: 75,
    condition: { type: "complete_trial" },
  },
] as const;

// 任务定义
export const TASKS = [
  // 新手引导任务
  {
    code: "GUIDE_COMPLETE_PROFILE",
    name: "完善档案",
    description: "完善你的个人档案，让更多人认识你",
    category: "GUIDE",
    expReward: 50,
    coinReward: 30,
    condition: { type: "complete_profile" },
  },
  {
    code: "GUIDE_UPLOAD_RESUME",
    name: "上传简历",
    description: "上传你的简历，开启求职之旅",
    category: "GUIDE",
    expReward: 30,
    coinReward: 20,
    condition: { type: "upload_resume" },
  },
  {
    code: "GUIDE_VIEW_JOBS",
    name: "探索职位",
    description: "浏览3个感兴趣的职位",
    category: "GUIDE",
    expReward: 20,
    coinReward: 10,
    condition: { type: "view_job", count: 3 },
  },
  {
    code: "GUIDE_FIRST_APPLY",
    name: "提交申请",
    description: "向心仪的职位提交申请",
    category: "GUIDE",
    expReward: 50,
    coinReward: 25,
    condition: { type: "apply_job", count: 1 },
  },
  {
    code: "GUIDE_JOIN_COMMUNITY",
    name: "加入社区",
    description: "发布你的第一个话题或回复",
    category: "GUIDE",
    expReward: 30,
    coinReward: 15,
    condition: { type: "community_activity" },
  },
  
  // 每日任务
  {
    code: "DAILY_LOGIN",
    name: "每日登录",
    description: "登录平台领取奖励",
    category: "DAILY",
    expReward: 10,
    coinReward: 10,
    condition: { type: "daily_login" },
  },
  {
    code: "DAILY_VIEW_JOBS",
    name: "浏览职位",
    description: "今天浏览5个职位",
    category: "DAILY",
    expReward: 15,
    coinReward: 8,
    condition: { type: "view_job", count: 5 },
  },
  {
    code: "DAILY_READ_ARTICLE",
    name: "阅读文章",
    description: "阅读一篇求职文章",
    category: "DAILY",
    expReward: 10,
    coinReward: 5,
    condition: { type: "read_article", count: 1 },
  },
] as const;

// 签到奖励配置
export const CHECKIN_REWARDS = {
  baseExp: 10,
  baseCoins: 10,
  consecutiveBonus: {
    3: { exp: 20, coins: 20, message: "连续3天！额外奖励！" },
    7: { exp: 50, coins: 50, message: "连续7天！你是认真的！" },
    14: { exp: 100, coins: 100, message: "连续14天！求职达人！" },
    30: { exp: 300, coins: 300, message: "连续30天！传奇求职者！" },
  },
};
