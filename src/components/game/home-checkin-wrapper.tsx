"use client";

import { useEffect, useState } from "react";
import { CheckinModal } from "@/components/game/checkin-modal";
import { ExpToast } from "@/components/game/exp-toast";

interface CheckinResult {
  expReward: number;
  coinReward: number;
  streak: number;
}

export function HomeCheckinWrapper() {
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // 检查今天是否已经签到
    const checkTodayCheckin = async () => {
      try {
        const res = await fetch("/api/game/checkin");
        if (res.ok) {
          const data = await res.json();
          // 如果今天没签到，显示弹窗
          if (!data.status?.isCheckedIn) {
            // 延迟2秒显示，避免页面加载时立即弹出
            setTimeout(() => {
              setShowCheckin(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("检查签到状态失败:", error);
      }
    };

    checkTodayCheckin();
  }, []);

  const handleCheckin = (result: CheckinResult) => {
    setCheckinResult(result);
    setShowToast(true);
    setShowCheckin(false);
  };

  return (
    <>
      <CheckinModal
        isOpen={showCheckin}
        onClose={() => setShowCheckin(false)}
        onCheckin={handleCheckin}
      />

      {showToast && checkinResult && (
        <ExpToast
          message={`签到成功！连续${checkinResult.streak}天`}
          exp={checkinResult.expReward}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
