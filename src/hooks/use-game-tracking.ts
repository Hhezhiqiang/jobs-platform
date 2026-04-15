"use client";

import { useCallback, useState } from "react";
import { useLevelUp } from "@/components/game/level-up-modal";

interface ExpResult {
  success: boolean;
  addedExp: number;
  isLevelUp?: boolean;
  newLevel?: {
    level: number;
    title: string;
    icon: string;
  };
  message: string;
}

/**
 * 游戏化追踪Hook
 * 封装所有游戏化追踪逻辑，自动处理升级弹窗
 */
export function useGameTracking() {
  const [loading, setLoading] = useState(false);
  const { showLevelUp, closeLevelUp } = useLevelUp();

  /**
   * 追踪行为并处理经验
   */
  const trackAction = useCallback(
    async (type: string, data?: { jobId?: string; articleId?: string }) => {
      setLoading(true);
      try {
        // 获取当前等级（用于比较）
        const profileRes = await fetch("/api/game/profile");
        const oldProfile = profileRes.ok ? await profileRes.json() : null;
        const oldLevel = oldProfile?.level || 1;

        // 发送追踪请求
        const res = await fetch("/api/game/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            ...data,
          }),
        });

        if (!res.ok) throw new Error("追踪失败");

        const result: ExpResult = await res.json();

        // 如果升级了，显示升级弹窗
        if (result.isLevelUp && result.newLevel) {
          showLevelUp({
            oldLevel,
            newLevel: result.newLevel.level,
            newTitle: result.newLevel.title,
            rewards: {
              exp: result.addedExp,
              coins: result.newLevel.level * 10,
              unlockedFeatures: getUnlockedFeatures(oldLevel, result.newLevel.level),
            },
          });
        }

        return result;
      } catch (error) {
        console.error("追踪失败:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showLevelUp]
  );

  /**
   * 追踪职位浏览
   */
  const trackJobView = useCallback(
    async (jobId: string) => {
      // 检查是否已追踪
      const viewedKey = `job_viewed_${jobId}`;
      const lastViewed = localStorage.getItem(viewedKey);
      const now = Date.now();

      if (lastViewed && now - parseInt(lastViewed) < 5 * 60 * 1000) {
        return;
      }

      localStorage.setItem(viewedKey, now.toString());

      // 延迟3秒后记录
      setTimeout(() => {
        trackAction("VIEW_JOB", { jobId });
      }, 3000);
    },
    [trackAction]
  );

  /**
   * 追踪职位申请
   */
  const trackJobApply = useCallback(
    async (jobId: string) => {
      return trackAction("APPLY_JOB", { jobId });
    },
    [trackAction]
  );

  /**
   * 追踪文章阅读
   */
  const trackArticleRead = useCallback(
    async (articleId: string) => {
      // 检查是否已追踪
      const readKey = `article_read_${articleId}`;
      const lastRead = localStorage.getItem(readKey);
      const now = Date.now();

      if (lastRead && now - parseInt(lastRead) < 30 * 60 * 1000) {
        return;
      }

      localStorage.setItem(readKey, now.toString());

      // 延迟10秒后记录
      setTimeout(() => {
        trackAction("READ_ARTICLE", { articleId });
      }, 10000);
    },
    [trackAction]
  );

  /**
   * 追踪完善资料
   */
  const trackProfileComplete = useCallback(async () => {
    return trackAction("COMPLETE_PROFILE");
  }, [trackAction]);

  return {
    loading,
    trackAction,
    trackJobView,
    trackJobApply,
    trackArticleRead,
    trackProfileComplete,
  };
}

/**
 * 获取升级解锁的功能
 */
function getUnlockedFeatures(oldLevel: number, newLevel: number): string[] {
  const features: string[] = [];

  const levelUnlocks: Record<number, string[]> = {
    2: ["简历模板库（基础）", "申请记录分析"],
    3: ["简历优先展示", "收藏上限提升"],
    5: ["每日申请上限+3", "专属求职顾问"],
    8: ["优先申请通道", "简历模板库（高级）"],
    10: ["简历高亮展示", "面试快速通道"],
    15: ["无限申请次数", "一对一职业规划"],
    20: ["企业HR直连", "专属内推机会"],
  };

  for (let level = oldLevel + 1; level <= newLevel; level++) {
    if (levelUnlocks[level]) {
      features.push(...levelUnlocks[level]);
    }
  }

  return [...new Set(features)];
}
