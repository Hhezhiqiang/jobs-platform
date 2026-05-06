"use client";

import { useEffect, useCallback } from "react";
import { logger } from '@/lib/logger';

interface JobViewTrackerProps {
  jobId: string;
}

/**
 * 职位浏览追踪组件
 * 当用户浏览职位详情时自动加经验
 */
export function GameJobViewTracker({ jobId }: JobViewTrackerProps) {
  const trackView = useCallback(async () => {
    try {
      // 检查是否已追踪（使用localStorage防止重复）
      const viewedKey = `job_viewed_${jobId}`;
      const lastViewed = localStorage.getItem(viewedKey);
      const now = Date.now();

      // 如果5分钟内已经浏览过，不再重复记录
      if (lastViewed && now - parseInt(lastViewed) < 5 * 60 * 1000) {
        return;
      }

      // 记录浏览时间
      localStorage.setItem(viewedKey, now.toString());

      // 发送追踪请求
      await fetch("/api/game/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIEW_JOB",
          jobId,
        }),
      });
    } catch (error) {
      logger.error("追踪职位浏览失败:", error);
    }
  }, [jobId]);

  useEffect(() => {
    // 延迟3秒后记录，确保用户确实在查看
    const timer = setTimeout(trackView, 3000);
    return () => clearTimeout(timer);
  }, [trackView]);

  return null;
}

interface JobApplyTrackerProps {
  jobId: string;
  onApply?: () => void;
}

/**
 * 职位申请追踪Hook
 * 在申请成功后调用以加经验
 */
export function useJobApplyTracker() {
  const trackApply = useCallback(async (jobId: string) => {
    try {
      await fetch("/api/game/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "APPLY_JOB",
          jobId,
        }),
      });
    } catch (error) {
      logger.error("追踪职位申请失败:", error);
    }
  }, []);

  return { trackApply };
}

/**
 * 文章阅读追踪
 */
export function useArticleReadTracker() {
  const trackRead = useCallback(async (articleId: string) => {
    try {
      // 检查是否已追踪
      const readKey = `article_read_${articleId}`;
      const lastRead = localStorage.getItem(readKey);
      const now = Date.now();

      // 如果30分钟内已经阅读过，不再重复记录
      if (lastRead && now - parseInt(lastRead) < 30 * 60 * 1000) {
        return;
      }

      localStorage.setItem(readKey, now.toString());

      await fetch("/api/game/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "READ_ARTICLE",
          articleId,
        }),
      });
    } catch (error) {
      logger.error("追踪文章阅读失败:", error);
    }
  }, []);

  return { trackRead };
}

/**
 * 完善资料追踪
 */
export function useProfileCompleteTracker() {
  const trackComplete = useCallback(async () => {
    try {
      await fetch("/api/game/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMPLETE_PROFILE",
        }),
      });
    } catch (error) {
      logger.error("追踪完善资料失败:", error);
    }
  }, []);

  return { trackComplete };
}
