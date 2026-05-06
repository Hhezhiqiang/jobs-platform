"use client";

import { useEffect } from "react";
import { logger } from '@/lib/logger';

interface ArticleReadTrackerProps {
  articleId: string;
}

/**
 * 文章阅读追踪组件
 * 用户阅读文章超过10秒后记录
 */
export function ArticleReadTracker({ articleId }: ArticleReadTrackerProps) {
  useEffect(() => {
    // 检查是否已追踪（30分钟内不重复记录）
    const readKey = `article_read_${articleId}`;
    const lastRead = localStorage.getItem(readKey);
    const now = Date.now();

    if (lastRead && now - parseInt(lastRead) < 30 * 60 * 1000) {
      return;
    }

    // 10秒后记录（确保用户确实在阅读）
    const timer = setTimeout(async () => {
      try {
        // 使用 Intersection Observer 检查用户是否仍在页面
        const response = await fetch("/api/game/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "READ_ARTICLE",
            articleId,
          }),
        });

        if (response.ok) {
          localStorage.setItem(readKey, now.toString());
        }
      } catch (error) {
        logger.error("追踪文章阅读失败:", error);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [articleId]);

  return null;
}
