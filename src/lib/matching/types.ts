/**
 * 文化匹配系统类型定义
 */

// 公司文化标签
export interface CompanyTag {
  tagName: string;
  voteCount: number;
}

// 匹配详情
export interface MatchDetail {
  tagName: string;
  voteCount: number;
  weight: number;
}

// 文化匹配结果
export interface CultureMatchResult {
  score: number;
  isCultureFit: boolean;
  level: string;
  color: string;
  matchedTags: MatchDetail[];
  unmatchedTags?: string[];
}

// 用户求职偏好
export interface UserJobPreferences {
  cultureTags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  employmentTypes: string[];
  locations: string[];
  remotePreference: string | null;
  experienceLevel: string | null;
  updatedAt?: Date | null;
}

// 带文化匹配度的推荐职位
export interface RecommendedJob {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string;
  employmentType: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string;
  city: string | null;
  isRemote: boolean;
  company: {
    id: string;
    name: string;
    nameEn: string | null;
    logo: string | null;
    slug: string;
  };
  cultureMatch: CultureMatchResult | null;
}

// 匹配度等级
export type MatchLevel = "low" | "medium" | "high" | "excellent";

// 匹配等级描述
export interface MatchLevelInfo {
  level: MatchLevel;
  label: string;
  color: string;
}
