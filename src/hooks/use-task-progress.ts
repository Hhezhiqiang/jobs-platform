"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from '@/lib/logger';

interface Task {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  expReward: number;
  coinReward: number;
  progress: number;
  target: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

interface UseTaskProgressResult {
  tasks: {
    guide: Task[];
    daily: Task[];
    achievement: Task[];
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProgress: (taskCode: string, progress: number) => Promise<void>;
}

/**
 * 任务进度管理Hook
 * 支持实时获取和更新任务进度
 */
export function useTaskProgress(): UseTaskProgressResult {
  const [tasks, setTasks] = useState<{
    guide: Task[];
    daily: Task[];
    achievement: Task[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/game/task-progress");
      
      if (!res.ok) {
        throw new Error("获取任务进度失败");
      }
      
      const data = await res.json();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (taskCode: string, progress: number) => {
    try {
      const res = await fetch("/api/game/task-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskCode, progress }),
      });

      if (!res.ok) {
        throw new Error("更新任务进度失败");
      }

      const data = await res.json();

      // 刷新任务列表
      await fetchTasks();

      return data;
    } catch (err) {
      logger.error("更新任务进度失败:", err);
      throw err;
    }
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refresh: fetchTasks,
    updateProgress,
  };
}

/**
 * 获取单个任务进度
 */
export function useSingleTaskProgress(taskCode: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/task-progress?taskCode=${taskCode}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (error) {
      logger.error("获取任务进度失败:", error);
    } finally {
      setLoading(false);
    }
  }, [taskCode]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return { task, loading, refresh: fetchTask };
}
