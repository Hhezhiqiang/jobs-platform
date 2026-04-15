"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  expReward: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

interface AchievementUnlockModalProps {
  achievement?: Achievement | null;
  onClose: () => void;
}

const rarityConfig = {
  COMMON: {
    color: "from-gray-400 to-gray-500",
    glow: "shadow-gray-400/50",
    border: "border-gray-300",
    label: "普通",
  },
  RARE: {
    color: "from-blue-400 to-blue-600",
    glow: "shadow-blue-400/50",
    border: "border-blue-300",
    label: "稀有",
  },
  EPIC: {
    color: "from-purple-400 to-purple-600",
    glow: "shadow-purple-400/50",
    border: "border-purple-300",
    label: "史诗",
  },
  LEGENDARY: {
    color: "from-yellow-400 to-orange-500",
    glow: "shadow-yellow-400/50",
    border: "border-yellow-300",
    label: "传说",
  },
};

/**
 * 成就解锁弹窗组件
 * 带有华丽的动画效果
 */
export function AchievementUnlockModal({
  achievement,
  onClose,
}: AchievementUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement) return null;

  const rarity = rarityConfig[achievement.rarity] || rarityConfig.COMMON;

  return (
    <AnimatePresence>
      {achievement && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 300,
            }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              className={`relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl ${rarity.glow} shadow-2xl pointer-events-auto border-4 ${rarity.border}`}
            >
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* 成就图标 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${rarity.color} flex items-center justify-center shadow-lg`}
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              {/* 标签 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`inline-block px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${rarity.color} text-white mb-4`}
              >
                {rarity.label} 成就解锁
              </motion.div>

              {/* 标题 */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-800 text-center mb-2"
              >
                {achievement.name}
              </motion.h2>

              {/* 描述 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-center mb-6"
              >
                {achievement.description}
              </motion.p>

              {/* 奖励 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-yellow-700">
                      +{achievement.expReward} 经验
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-purple-700">
                      成就点数 +1
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* 按钮 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${rarity.color} hover:shadow-lg transition-shadow`}
              >
                太棒了！
              </motion.button>

              {/* 装饰粒子 */}
              {showConfetti && <ConfettiEffect />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 礼花粒子效果
 */
function ConfettiEffect() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * 400 - 200,
    color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"][
      Math.floor(Math.random() * 5)
    ],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: 1,
            rotate: particle.rotation,
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

/**
 * 成就解锁Hook
 * 用于检测新解锁的成就并显示弹窗
 */
export function useAchievementUnlock() {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const checkNewAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/game/achievements/check");
      if (res.ok) {
        const data = await res.json();
        if (data.newAchievements?.length > 0) {
          // 显示第一个新成就
          setUnlockedAchievement(data.newAchievements[0]);
        }
      }
    } catch (error) {
      console.error("检查成就失败:", error);
    }
  }, []);

  const closeModal = useCallback(() => {
    setUnlockedAchievement(null);
    // 继续检查是否还有更多成就
    setTimeout(() => checkNewAchievements(), 500);
  }, [checkNewAchievements]);

  return {
    unlockedAchievement,
    checkNewAchievements,
    closeModal,
    AchievementModal: (
      <AchievementUnlockModal
        achievement={unlockedAchievement}
        onClose={closeModal}
      />
    ),
  };
}
