"use client";

import { useState, useCallback, useEffect } from "react";
import { logger } from '@/lib/logger';

interface CultureMatchResult {
  score: number;
  isCultureFit: boolean;
  level: string;
  color: string;
  matchedTags: { tagName: string; voteCount: number; weight: number }[];
  unmatchedTags: string[];
}

interface JobPreferences {
  cultureTags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  employmentTypes: string[];
  locations: string[];
  remotePreference: string | null;
  experienceLevel: string | null;
  updatedAt?: Date | null;
}

interface RecommendedJob {
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

interface UseCultureMatchReturn {
  // 数据
  preferences: JobPreferences | null;
  recommendedJobs: RecommendedJob[];
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
  hasPreferences: boolean;

  // 方法
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<JobPreferences>) => Promise<boolean>;
  fetchRecommendedJobs: (page?: number, limit?: number) => Promise<void>;
  getJobCultureMatch: (jobId: string) => Promise<{
    matchResult: CultureMatchResult | null;
    companyTags: { tagName: string; voteCount: number }[];
  } | null>;
}

/**
 * 文化匹配 Hook
 * 
 * 用于获取/更新用户求职偏好，以及获取带文化匹配度的推荐职位
 * 
 * 使用示例：
 * ```tsx
 * const { 
 *   preferences, 
 *   recommendedJobs, 
 *   isLoading,
 *   updatePreferences,
 *   fetchRecommendedJobs 
 * } = useCultureMatch();
 * 
 * useEffect(() => {
 *   fetchRecommendedJobs();
 * }, []);
 * ```
 */
export function useCultureMatch(): UseCultureMatchReturn {
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasPreferences, setHasPreferences] = useState(false);

  /**
   * 获取用户求职偏好
   */
  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/user/job-preferences");
      if (!response.ok) {
        if (response.status === 401) {
          setPreferences(null);
          setHasPreferences(false);
          return;
        }
        throw new Error("获取求职偏好失败");
      }

      const data = await response.json();
      setPreferences(data);
      setHasPreferences(!!data.cultureTags && data.cultureTags.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 更新用户求职偏好
   */
  const updatePreferences = useCallback(
    async (data: Partial<JobPreferences>): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/user/job-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "更新失败");
        }

        const result = await response.json();
        setPreferences(result.preferences);
        setHasPreferences(
          !!result.preferences.cultureTags &&
            result.preferences.cultureTags.length > 0
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 获取推荐职位（带文化匹配度）
   */
  const fetchRecommendedJobs = useCallback(
    async (page: number = 1, limit: number = 20) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/jobs/recommended?page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("获取推荐职位失败");
        }

        const data = await response.json();
        setRecommendedJobs(data.jobs);
        setTotalJobs(data.total);
        setHasPreferences(data.hasPreferences);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 获取单个职位的文化匹配度
   */
  const getJobCultureMatch = useCallback(
    async (
      jobId: string
    ): Promise<{
      matchResult: CultureMatchResult | null;
      companyTags: { tagName: string; voteCount: number }[];
    } | null> => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/culture-match`);

        if (!response.ok) {
          throw new Error("获取匹配度失败");
        }

        const data = await response.json();

        if (!data.hasMatch) {
          return {
            matchResult: null,
            companyTags: data.companyTags || [],
          };
        }

        return {
          matchResult: data.matchResult,
          companyTags: data.companyTags || [],
        };
      } catch (err) {
        logger.error("获取职位文化匹配度失败:", err);
        return null;
      }
    },
    []
  );

  // 初始加载时获取用户偏好
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    recommendedJobs,
    isLoading,
    error,
    totalJobs,
    hasPreferences,
    fetchPreferences,
    updatePreferences,
    fetchRecommendedJobs,
    getJobCultureMatch,
  };
}

/**
 * 公司文化标签管理 Hook
 * 
 * 用于获取和管理公司文化标签
 */
export function useCompanyCultureTags(companyId: string) {
  const [tags, setTags] = useState<{ tagName: string; voteCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取公司文化标签
   */
  const fetchTags = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/culture-tags`);

      if (!response.ok) {
        throw new Error("获取标签失败");
      }

      const data = await response.json();
      setTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  /**
   * 添加/投票标签
   */
  const voteTag = useCallback(
    async (tagName: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/companies/${companyId}/culture-tags`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagName, action: "vote" }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "操作失败");
        }

        // 刷新标签列表
        await fetchTags();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, fetchTags]
  );

  /**
   * 移除标签认同
   */
  const unvoteTag = useCallback(
    async (tagName: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/companies/${companyId}/culture-tags`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagName, action: "remove" }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "操作失败");
        }

        await fetchTags();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, fetchTags]
  );

  // 初始加载
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    voteTag,
    unvoteTag,
  };
}

export default useCultureMatch;
