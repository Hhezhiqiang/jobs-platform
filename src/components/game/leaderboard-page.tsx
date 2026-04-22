"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Flame,
  TrendingUp,
  User,
  Loader2,
} from "lucide-react";
import Image from "next/image";

type LeaderboardType = "weekly" | "monthly" | "alltime";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  level: number;
  title: string;
  exp: number;
  achievements: number;
  isCurrentUser: boolean;
}

export function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("weekly");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/leaderboard?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
        setCurrentUserRank(data.currentUserRank);
      }
    } catch (error) {
      console.error("获取排行榜失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "weekly" as const, label: "本周榜", icon: Flame },
    { id: "monthly" as const, label: "本月榜", icon: TrendingUp },
    { id: "alltime" as const, label: "总榜", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800 mb-2"
          >
            🏆 排行榜
          </motion.h1>
          <p className="text-gray-600">与全站求职者一起竞技，争夺最高荣誉</p>
        </div>

        {/* 标签切换 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setType(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  type === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 前三名展示 */}
        {!loading && leaderboard.length > 0 && (
          <TopThreeDisplay entries={leaderboard.slice(0, 3)} />
        )}

        {/* 排行榜列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
            <div className="col-span-1 text-center">排名</div>
            <div className="col-span-5">用户</div>
            <div className="col-span-2 text-center">等级</div>
            <div className="col-span-2 text-center">经验</div>
            <div className="col-span-2 text-center">成就</div>
          </div>

          {/* 列表内容 */}
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : (
              <>
                {leaderboard.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    index={index}
                  />
                ))}

                {/* 当前用户排名（如果不在榜单中） */}
                {currentUserRank && (
                  <>
                    <div className="border-t-2 border-dashed border-gray-300 my-2" />
                    <LeaderboardRow
                      entry={currentUserRank}
                      index={currentUserRank.rank - 1}
                      isCurrentUser
                    />
                  </>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * 前三名展示组件
 */
function TopThreeDisplay({ entries }: { entries: LeaderboardEntry[] }) {
  const positions = [
    { rank: 2, color: "from-gray-300 to-gray-400", icon: Medal },
    { rank: 1, color: "from-yellow-400 to-yellow-500", icon: Crown },
    { rank: 3, color: "from-orange-400 to-orange-500", icon: Award },
  ];

  return (
    <div className="flex justify-center items-end gap-4 mb-8">
      {positions.map((pos) => {
        const entry = entries.find((e) => e.rank === pos.rank);
        if (!entry) return null;

        const isFirst = pos.rank === 1;

        return (
          <motion.div
            key={pos.rank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pos.rank * 0.1 }}
            className={`flex flex-col items-center ${
              isFirst ? "order-2 -mt-8" : pos.rank === 2 ? "order-1" : "order-3"
            }`}
          >
            {/* 头像 */}
            <div
              className={`relative ${
                isFirst ? "w-24 h-24" : "w-16 h-16"
              } rounded-full bg-gradient-to-br ${
                pos.color
              } p-1 shadow-lg`}
            >
              <div className="w-full h-full rounded-full bg-white overflow-hidden">
                {entry.avatar ? (
                  <Image
                    src={entry.avatar}
                    alt={entry.name}
                    width={isFirst ? 96 : 64}
                    height={isFirst ? 96 : 64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-1/2 h-1/2 text-gray-400" />
                  </div>
                )}
              </div>
              {/* 排名图标 */}
              <div
                className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${
                  pos.color
                } flex items-center justify-center shadow-md`}
              >
                <pos.icon className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* 信息 */}
            <div className="mt-3 text-center">
              <div
                className={`font-bold text-gray-800 ${
                  isFirst ? "text-lg" : "text-base"
                }`}
              >
                {entry.name}
              </div>
              <div className="text-sm text-gray-500">Lv.{entry.level} {entry.title}</div>
              <div className="text-sm font-semibold text-purple-600 mt-1">
                {entry.exp.toLocaleString()} 经验
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * 排行榜行组件
 */
function LeaderboardRow({
  entry,
  index,
  isCurrentUser = false,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}) {
  const rankIcons = [
    { bg: "bg-yellow-100", text: "text-yellow-700", icon: Crown },
    { bg: "bg-gray-100", text: "text-gray-700", icon: Medal },
    { bg: "bg-orange-100", text: "text-orange-700", icon: Award },
  ];

  const rankStyle =
    entry.rank <= 3
      ? rankIcons[entry.rank - 1]
      : { bg: "bg-gray-100", text: "text-gray-600", icon: null };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
        isCurrentUser ? "bg-purple-50/50" : ""
      }`}
    >
      {/* 排名 */}
      <div className="col-span-1 flex justify-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankStyle.bg} ${rankStyle.text}`}
        >
          {rankStyle.icon ? (
            <rankStyle.icon className="w-4 h-4" />
          ) : (
            entry.rank
          )}
        </div>
      </div>

      {/* 用户信息 */}
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {entry.avatar ? (
            <Image
              src={entry.avatar}
              alt={entry.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-800 truncate flex items-center gap-2">
            {entry.name}
            {isCurrentUser && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                我
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">{entry.title}</div>
        </div>
      </div>

      {/* 等级 */}
      <div className="col-span-2 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          Lv.{entry.level}
        </span>
      </div>

      {/* 经验 */}
      <div className="col-span-2 text-center font-medium text-gray-700">
        {entry.exp.toLocaleString()}
      </div>

      {/* 成就 */}
      <div className="col-span-2 text-center">
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {entry.achievements}
        </span>
      </div>
    </motion.div>
  );
}
