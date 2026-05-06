import { useState, useEffect, useCallback } from "react";
import { logger } from '@/lib/logger';

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

export function useGameProfile() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/game/profile");
      
      if (!res.ok) {
        if (res.status === 401) {
          setProfile(null);
          return;
        }
        throw new Error("获取游戏档案失败");
      }
      
      const data = await res.json();
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, []);

  const trackLogin = useCallback(async () => {
    try {
      const res = await fetch("/api/game/profile", {
        method: "POST",
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      logger.error("记录登录失败:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    trackLogin,
  };
}
