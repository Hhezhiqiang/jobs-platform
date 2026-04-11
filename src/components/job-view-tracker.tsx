"use client";

import { useEffect } from "react";
import { Job, Company } from "@prisma/client";
import { recordJobView } from "@/lib/recommendations";

interface JobViewTrackerProps {
  job: Job & { company: Company };
}

/**
 * 职位浏览追踪器
 * 
 * 在客户端记录用户浏览历史，用于个性化推荐
 * 注意：此组件不渲染任何 UI，只负责副作用
 */
export function JobViewTracker({ job }: JobViewTrackerProps) {
  useEffect(() => {
    // 延迟记录，确保用户确实在查看页面（停留超过2秒）
    const timer = setTimeout(() => {
      recordJobView(job);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [job]);

  return null;
}
