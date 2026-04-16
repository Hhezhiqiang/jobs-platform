"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Sparkles, Star, Zap, ChevronUp } from "lucide-react";

interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  rewards: {
    exp: number;
    coins: number;
    unlockedFeatures?: string[];
  };
}

interface LevelUpModalProps {
  data?: LevelUpData | null;
  onClose: () => void;
}

/**
 * 等级升级全屏特效弹窗
 */
export function LevelUpModal({ data, onClose }: LevelUpModalProps) {
  const [showEffects, setShowEffects] = useState(true);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setShowEffects(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return null;

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* 全屏背景特效 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-600/90 via-blue-600/90 to-pink-600/90 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* 粒子背景 */}
          {showEffects && <ParticleBackground />}

          {/* 主要内容 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="relative bg-white rounded-3xl p-10 max-w-lg w-full mx-4 shadow-2xl pointer-events-auto">
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* 升级动画 */}
              <div className="relative text-center mb-8">
                {/* 旧等级 */}
                <motion.div
                  initial={{ x: 0, opacity: 1, scale: 1 }}
                  animate={{ x: -100, opacity: 0, scale: 0.5 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="text-6xl font-black text-gray-300">
                    Lv.{data.oldLevel}
                  </div>
                </motion.div>

                {/* 升级箭头 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg"
                  >
                    <ChevronUp className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* 新等级 */}
                <motion.div
                  initial={{ x: 100, opacity: 0, scale: 0.5 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      textShadow: [
                        "0 0 20px rgba(147, 51, 234, 0.5)",
                        "0 0 40px rgba(147, 51, 234, 0.8)",
                        "0 0 20px rgba(147, 51, 234, 0.5)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-7xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent"
                  >
                    Lv.{data.newLevel}
                  </motion.div>
                </motion.div>

                {/* 新称号 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full border border-yellow-300"
                >
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-semibold">
                    {data.newTitle}
                  </span>
                </motion.div>
              </div>

              {/* 恭喜文字 */}
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2 }}
                className="text-2xl font-bold text-center text-gray-800 mb-6"
              >
                🎉 恭喜升级！
              </motion.h2>

              {/* 奖励展示 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6"
              >
                <h3 className="text-sm font-medium text-gray-500 mb-4">升级奖励</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">经验值</div>
                      <div className="font-bold text-yellow-600">+{data.rewards.exp}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">金币</div>
                      <div className="font-bold text-purple-600">+{data.rewards.coins}</div>
                    </div>
                  </div>
                </div>

                {/* 解锁功能 */}
                {data.rewards.unlockedFeatures && data.rewards.unlockedFeatures.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.6 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        解锁新特权
                      </span>
                    </div>
                    <div className="space-y-2">
                      {data.rewards.unlockedFeatures.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.8 + index * 0.1 }}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* 继续按钮 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                继续前进！
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 预生成的粒子数据（避免 render 时调用 impure 函数）
 */
const PARTICLE_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#EC4899"];
const PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  color: PARTICLE_COLORS[i % 5],
  left: 50 + Math.sin(i * 0.5) * 40, // 使用确定性计算代替 Math.random
  xDrift: Math.cos(i * 0.7) * 100,
  duration: 3 + (i % 5) * 0.5,
  delay: (i % 10) * 0.2,
}));

/**
 * 粒子背景效果（使用固定高度避免 impure 调用）
 */
function ParticleBackground() {
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: p.color,
            left: `${p.left}%`,
            top: "100%",
          }}
          animate={{
            y: [0, -viewportHeight - 100],
            x: [0, p.xDrift],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * 等级升级Hook
 */
export function useLevelUp() {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  const showLevelUp = useCallback((data: LevelUpData) => {
    setLevelUpData(data);
  }, []);

  const closeLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  return {
    levelUpData,
    showLevelUp,
    closeLevelUp,
    LevelUpModal: (
      <LevelUpModal data={levelUpData} onClose={closeLevelUp} />
    ),
  };
}
