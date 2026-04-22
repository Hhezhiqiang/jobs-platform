"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface GameProfile {
  id: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  coins: number;
  title: string;
  loginStreak: number;
  progressPercent: number;
  titleInfo: {
    title: string;
    icon: string;
  };
}

export function LevelCard() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/game/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("获取游戏档案失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* 基础信息 - 始终显示 */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* 等级图标 */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
            {profile.titleInfo.icon}
          </div>

          {/* 等级信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                Lv.{profile.level}
              </span>
              <span className="text-sm text-gray-500">
                {profile.titleInfo.title}
              </span>
            </div>

            {/* 经验条 */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{profile.exp} / {profile.nextLevelExp} EXP</span>
                <span>{profile.progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${profile.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 展开箭头 */}
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </div>

      {/* 扩展信息 */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100"
        >
          {/* 统计 */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700">
                <span>🪙</span>
                <span className="text-sm">金币</span>
              </div>
              <div className="text-xl font-bold text-amber-800">{profile.coins}</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-700">
                <span>🔥</span>
                <span className="text-sm">连续登录</span>
              </div>
              <div className="text-xl font-bold text-orange-800">{profile.loginStreak} 天</div>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="px-4 pb-4 space-y-2">
            <Link
              href={`/${locale}/dashboard/achievements`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <span>🏆</span>
              我的成就
            </Link>
            <Link
              href={`/${locale}/dashboard/quests`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <span>📋</span>
              我的任务
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
