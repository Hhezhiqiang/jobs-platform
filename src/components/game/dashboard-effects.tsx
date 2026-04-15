"use client";

import { useEffect } from "react";
import { useAchievementUnlock } from "@/components/game/achievement-unlock-modal";
import { useLevelUp } from "@/components/game/level-up-modal";

/**
 * Dashboard特效集成组件
 * 自动检测成就解锁和等级升级并显示弹窗
 */
export function DashboardEffects() {
  const { AchievementModal, checkNewAchievements } = useAchievementUnlock();
  const { LevelUpModal, showLevelUp, closeLevelUp, levelUpData } = useLevelUp();

  // 页面加载时检查新成就
  useEffect(() => {
    // 延迟检查，避免页面加载时立即弹出
    const timer = setTimeout(() => {
      checkNewAchievements();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkNewAchievements]);

  // 监听经验值变化（通过自定义事件）
  useEffect(() => {
    const handleExpAdded = (event: CustomEvent) => {
      const { oldLevel, newLevel, newTitle } = event.detail;

      if (newLevel > oldLevel) {
        // 触发升级弹窗
        showLevelUp({
          oldLevel,
          newLevel,
          newTitle,
          rewards: {
            exp: 0,
            coins: newLevel * 10,
            unlockedFeatures: getUnlockedFeatures(oldLevel, newLevel),
          },
        });
      }
    };

    window.addEventListener("expAdded" as any, handleExpAdded);
    return () => window.removeEventListener("expAdded" as any, handleExpAdded);
  }, [showLevelUp]);

  return (
    <>
      {AchievementModal}
      {LevelUpModal}
    </>
  );
}

/**
 * 获取升级解锁的功能
 */
function getUnlockedFeatures(oldLevel: number, newLevel: number): string[] {
  const features: string[] = [];

  // 检查每个等级解锁的功能
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
