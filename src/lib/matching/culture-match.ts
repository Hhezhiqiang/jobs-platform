/**
 * 文化匹配度计算模块
 * 
 * 计算用户期望标签与公司共识标签的匹配度
 * 考虑标签权重（认同人数越多权重越高）
 */

export interface CompanyTag {
  tagName: string;
  voteCount: number;
}

export interface MatchDetail {
  tagName: string;
  voteCount: number;
  weight: number;
}

export interface CultureMatchResult {
  score: number;           // 0-100 的匹配度分数
  matchedTags: MatchDetail[];  // 匹配的标签详情
  unmatchedTags: string[];    // 未匹配的用户期望标签
}

/**
 * 标签权重配置
 * 认同人数越多，权重越高（非线性增长）
 */
const VOTE_WEIGHTS: Record<number, number> = {
  1: 1.0,   // 基础权重
  2: 1.2,   // 2人认同
  3: 1.5,   // 3人认同
  4: 1.8,   // 4人认同
  5: 2.0,   // 5人及以上
};

/**
 * 获取标签权重
 * 根据认同人数计算权重
 */
function getTagWeight(voteCount: number): number {
  if (voteCount >= 5) return VOTE_WEIGHTS[5];
  return VOTE_WEIGHTS[voteCount] || VOTE_WEIGHTS[1];
}

/**
 * 计算文化匹配度
 * 
 * @param userPreferences - 用户期望的标签 ["扁平管理", "技术驱动"]
 * @param companyTags - 公司标签及票数 [{tagName: "扁平管理", voteCount: 3}, ...]
 * @returns 0-100 的匹配度分数
 */
export function calculateCultureMatch(
  userPreferences: string[],
  companyTags: CompanyTag[]
): number {
  if (!userPreferences || userPreferences.length === 0) {
    return 50; // 如果没有用户偏好，返回中性分数
  }

  if (!companyTags || companyTags.length === 0) {
    return 0; // 如果公司没有任何标签，返回0分
  }

  // 标准化标签（去除空格，统一大小写）
  const normalizedUserTags = userPreferences.map((tag) =>
    tag.trim().toLowerCase()
  );

  const normalizedCompanyTags = new Map<string, CompanyTag>();
  companyTags.forEach((tag) => {
    const normalized = tag.tagName.trim().toLowerCase();
    // 如果同一标签有多个条目，保留票数最高的
    const existing = normalizedCompanyTags.get(normalized);
    if (!existing || existing.voteCount < tag.voteCount) {
      normalizedCompanyTags.set(normalized, tag);
    }
  });

  // 计算匹配
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedTags: MatchDetail[] = [];
  const unmatchedTags: string[] = [];

  // 遍历用户的每个偏好标签
  for (const userTag of normalizedUserTags) {
    const companyTag = normalizedCompanyTags.get(userTag);

    if (companyTag) {
      // 标签匹配，根据票数计算权重
      const weight = getTagWeight(companyTag.voteCount);
      totalWeight += weight;
      matchedWeight += weight;

      matchedTags.push({
        tagName: companyTag.tagName,
        voteCount: companyTag.voteCount,
        weight,
      });
    } else {
      // 标签不匹配，使用基础权重计入总分母
      totalWeight += VOTE_WEIGHTS[1];
      unmatchedTags.push(userTag);
    }
  }

  // 计算百分比（0-100）
  // 基础分：50，匹配加分：50
  // 公式：50 + (matchedWeight / totalWeight) * 50
  const matchRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const score = Math.round(50 + matchRatio * 50);

  return Math.min(100, Math.max(0, score));
}

/**
 * 计算文化匹配度（详细版本）
 * 返回完整的匹配信息，包括匹配详情
 */
export function calculateCultureMatchDetailed(
  userPreferences: string[],
  companyTags: CompanyTag[]
): CultureMatchResult {
  if (!userPreferences || userPreferences.length === 0) {
    return {
      score: 50,
      matchedTags: [],
      unmatchedTags: [],
    };
  }

  if (!companyTags || companyTags.length === 0) {
    return {
      score: 0,
      matchedTags: [],
      unmatchedTags: userPreferences,
    };
  }

  // 标准化标签
  const normalizedUserTags = userPreferences.map((tag) =>
    tag.trim().toLowerCase()
  );

  const normalizedCompanyTags = new Map<string, CompanyTag>();
  companyTags.forEach((tag) => {
    const normalized = tag.tagName.trim().toLowerCase();
    const existing = normalizedCompanyTags.get(normalized);
    if (!existing || existing.voteCount < tag.voteCount) {
      normalizedCompanyTags.set(normalized, tag);
    }
  });

  // 计算匹配
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedTags: MatchDetail[] = [];
  const unmatchedTags: string[] = [];

  for (const userTag of normalizedUserTags) {
    const companyTag = normalizedCompanyTags.get(userTag);

    if (companyTag) {
      const weight = getTagWeight(companyTag.voteCount);
      totalWeight += weight;
      matchedWeight += weight;

      matchedTags.push({
        tagName: companyTag.tagName,
        voteCount: companyTag.voteCount,
        weight,
      });
    } else {
      totalWeight += VOTE_WEIGHTS[1];
      unmatchedTags.push(userTag);
    }
  }

  const matchRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const score = Math.round(50 + matchRatio * 50);

  return {
    score: Math.min(100, Math.max(0, score)),
    matchedTags,
    unmatchedTags,
  };
}

/**
 * 判断是否文化契合（匹配度 > 80%）
 */
export function isCultureFit(score: number): boolean {
  return score >= 80;
}

/**
 * 获取匹配度等级描述
 */
export function getMatchLevel(score: number): {
  level: "low" | "medium" | "high" | "excellent";
  label: string;
  color: string;
} {
  if (score >= 90) {
    return { level: "excellent", label: "完美契合", color: "#22c55e" };
  }
  if (score >= 80) {
    return { level: "high", label: "文化契合", color: "#3b82f6" };
  }
  if (score >= 60) {
    return { level: "medium", label: "较为匹配", color: "#f59e0b" };
  }
  return { level: "low", label: "一般匹配", color: "#6b7280" };
}
