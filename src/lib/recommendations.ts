import { Job, Company, JobApplication } from "@prisma/client";

// 推荐职位类型
export interface RecommendedJob extends Job {
  company: Company;
  matchScore: number;
  matchReasons: string[];
}

// 用户行为数据（localStorage 存储结构）
export interface UserBehaviorData {
  viewedJobs: string[]; // job IDs
  viewedAt: Record<string, number>; // jobId -> timestamp
  appliedJobs: string[]; // job IDs (从 API 获取)
  skills: string[]; // 用户技能标签
  lastUpdated: number;
}

// 浏览历史记录（单个职位）
export interface JobViewRecord {
  jobId: string;
  title: string;
  category?: string;
  keywords: string[];
  viewedAt: number;
}

const STORAGE_KEY = "job_recommendation_data";

/**
 * 从 localStorage 获取用户行为数据
 */
export function getUserBehaviorData(): UserBehaviorData {
  if (typeof window === "undefined") {
    return { viewedJobs: [], viewedAt: {}, appliedJobs: [], skills: [], lastUpdated: 0 };
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to parse recommendation data:", error);
  }
  
  return { viewedJobs: [], viewedAt: {}, appliedJobs: [], skills: [], lastUpdated: 0 };
}

/**
 * 保存用户行为数据到 localStorage
 */
export function saveUserBehaviorData(data: UserBehaviorData): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastUpdated: Date.now(),
    }));
  } catch (error) {
    console.error("Failed to save recommendation data:", error);
  }
}

/**
 * 记录职位浏览
 */
export function recordJobView(job: Job & { company: Company }): void {
  if (typeof window === "undefined") return;
  
  const data = getUserBehaviorData();
  const jobId = job.id;
  
  // 避免重复记录同一职位（24小时内）
  const lastViewed = data.viewedAt[jobId];
  if (lastViewed && Date.now() - lastViewed < 24 * 60 * 60 * 1000) {
    return;
  }
  
  // 添加到浏览历史（最多保留50个）
  if (!data.viewedJobs.includes(jobId)) {
    data.viewedJobs.unshift(jobId);
    if (data.viewedJobs.length > 50) {
      data.viewedJobs = data.viewedJobs.slice(0, 50);
    }
  }
  
  data.viewedAt[jobId] = Date.now();
  
  // 提取技能标签
  const jobSkills = extractSkillsFromJob(job);
  data.skills = mergeSkills(data.skills, jobSkills);
  
  saveUserBehaviorData(data);
}

/**
 * 从职位信息中提取技能标签
 */
function extractSkillsFromJob(job: Job): string[] {
  const skills: string[] = [];
  const text = `${job.title} ${job.description} ${job.requirements || ""}`;
  
  // 常见技术关键词映射
  const skillKeywords: Record<string, string[]> = {
    "JavaScript": ["javascript", "js", "es6", "typescript", "ts"],
    "React": ["react", "reactjs", "react.js"],
    "Vue": ["vue", "vuejs", "vue.js"],
    "Angular": ["angular"],
    "Node.js": ["node", "nodejs", "node.js"],
    "Python": ["python"],
    "Java": ["java"],
    "Go": ["golang", "go"],
    "Rust": ["rust"],
    "PHP": ["php"],
    "Ruby": ["ruby"],
    "C++": ["c++"],
    "C#": ["c#", "csharp"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "Flutter": ["flutter"],
    "React Native": ["react native"],
    "SQL": ["sql", "mysql", "postgresql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "GCP": ["gcp", "google cloud"],
    "AI": ["ai", "artificial intelligence", "机器学习", "深度学习"],
    "Blockchain": ["blockchain", "web3", "智能合约", "solidity"],
    "Product Manager": ["产品经理", "product manager"],
    "Designer": ["设计师", "designer", "ui", "ux"],
    "Marketing": ["marketing", "市场", "运营"],
    "Sales": ["sales", "销售"],
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
      skills.push(skill);
    }
  }
  
  // 去重并限制数量
  return Array.from(new Set(skills)).slice(0, 10);
}

/**
 * 合并技能标签
 */
function mergeSkills(existing: string[], newSkills: string[]): string[] {
  const merged = Array.from(new Set([...existing, ...newSkills]));
  return merged.slice(0, 20); // 最多保留20个技能
}

/**
 * 更新申请历史（从 API 获取后调用）
 */
export function updateAppliedJobs(applications: JobApplication[]): void {
  if (typeof window === "undefined") return;
  
  const data = getUserBehaviorData();
  data.appliedJobs = applications.map(app => app.jobId);
  saveUserBehaviorData(data);
}

/**
 * 清除推荐数据
 */
export function clearRecommendationData(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 计算职位匹配分数
 */
export function calculateMatchScore(
  job: Job,
  behaviorData: UserBehaviorData
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  const jobSkills = extractSkillsFromJob(job);
  
  // 1. 技能匹配（最高40分）
  if (behaviorData.skills.length > 0) {
    const matchedSkills = jobSkills.filter(skill => 
      behaviorData.skills.some(userSkill => 
        userSkill.toLowerCase() === skill.toLowerCase() ||
        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const skillScore = Math.min(matchedSkills.length * 8, 40);
    score += skillScore;
    
    if (matchedSkills.length > 0) {
      reasons.push(`技能匹配: ${matchedSkills.slice(0, 3).join(", ")}`);
    }
  }
  
  // 2. 浏览历史相似度（最高30分）
  if (behaviorData.viewedJobs.length > 0) {
    // 基于浏览过的职位类型进行推荐
    const recentViews = behaviorData.viewedJobs.slice(0, 10);
    const viewBonus = Math.min(recentViews.length * 2, 20);
    score += viewBonus;
    
    if (viewBonus > 0) {
      reasons.push("基于您的浏览历史推荐");
    }
  }
  
  // 3. 申请历史排除（不加分，用于后续过滤）
  if (behaviorData.appliedJobs.includes(job.id)) {
    score -= 100; // 已申请的职位降低权重
    reasons.push("您已申请过此职位");
  }
  
  // 4. 职位新鲜度（最高20分）
  const daysSincePosted = Math.floor(
    (Date.now() - new Date(job.datePosted).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSincePosted <= 3) {
    score += 20;
    reasons.push("新发布职位");
  } else if (daysSincePosted <= 7) {
    score += 10;
    reasons.push("本周发布");
  }
  
  // 5. 热门职位加分（最高10分）
  if (job.isFeatured) {
    score += 10;
    reasons.push("热门职位");
  }
  
  return { score: Math.max(0, score), reasons };
}

/**
 * 获取推荐排序权重（结合匹配度和时间）
 */
export function getRecommendationWeight(
  job: Job,
  matchScore: number
): number {
  // 发布时间衰减因子（越新权重越高）
  const daysSincePosted = Math.floor(
    (Date.now() - new Date(job.datePosted).getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeDecay = Math.exp(-daysSincePosted / 7); // 7天半衰期
  
  // 综合权重 = 匹配度 * 0.7 + 时间权重 * 30
  return matchScore * 0.7 + timeDecay * 30;
}
