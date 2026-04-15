"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CheckinStatus {
  isCheckedIn: boolean;
  streak: number;
  todayReward: number;
}

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckin?: (result: { expReward: number; coinReward: number; streak: number }) => void;
}

export function CheckinModal({ isOpen, onClose, onCheckin }: CheckinModalProps) {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    expReward: number;
    coinReward: number;
    streak: number;
    bonusMessage?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/game/checkin");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error("获取签到状态失败:", error);
    }
  };

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/game/checkin", {
        method: "POST",
      });
      const data = await res.json();
      setResult(data);
      
      if (data.success && onCheckin) {
        onCheckin({
          expReward: data.expReward,
          coinReward: data.coinReward,
          streak: data.streak,
        });
      }
      
      // 刷新状态
      fetchStatus();
    } catch (error) {
      console.error("签到失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="text-5xl mb-2">📅</div>
              <h2 className="text-2xl font-bold">每日签到</h2>
              <p className="text-white/80 text-sm mt-1">连续签到获取更多奖励</p>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {result?.success ? (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="text-lg font-bold text-gray-900 mb-2">签到成功！</p>
                {result.bonusMessage && (
                  <p className="text-amber-600 text-sm mb-3">{result.bonusMessage}</p>
                )}
                <div className="flex justify-center gap-4">
                  <div className="bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-green-600 text-sm">+{result.expReward} EXP</span>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-4 py-2">
                    <span className="text-amber-600 text-sm">+{result.coinReward} 金币</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-4">连续签到 {result.streak} 天</p>
              </div>
            ) : (
              <>
                {/* 连续天数 */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {status?.streak || 0}
                  </div>
                  <div className="text-gray-500 text-sm">连续签到天数</div>
                </div>

                {/* 奖励预览 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-2">今日奖励</div>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl">✨</div>
                      <div className="text-sm text-gray-600">+{status?.todayReward || 10} EXP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">🪙</div>
                      <div className="text-sm text-gray-600">+{status?.todayReward || 10} 金币</div>
                    </div>
                  </div>
                </div>

                {/* 签到按钮 */}
                <button
                  onClick={handleCheckin}
                  disabled={loading || status?.isCheckedIn}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    status?.isCheckedIn
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg"
                  }`}
                >
                  {loading
                    ? "签到中..."
                    : status?.isCheckedIn
                    ? "今日已签到"
                    : "立即签到"}
                </button>

                {/* 连续奖励说明 */}
                <div className="mt-6 text-xs text-gray-400 text-center">
                  <p>连续7天奖励翻倍 · 连续30天超级奖励</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
