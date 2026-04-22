import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 60) {
    return "刚刚";
  } else if (diffInMins < 60) {
    return `${diffInMins}分钟前`;
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  } else if (diffInDays === 1) {
    return "昨天";
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`;
  } else if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)}周前`;
  } else if (diffInDays < 365) {
    return `${Math.floor(diffInDays / 30)}个月前`;
  } else {
    return `${Math.floor(diffInDays / 365)}年前`;
  }
}

export function formatSalary(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) {
    return "薪资面议";
  }

  // 统一规范化到 K：所有 >1000 的值都除以 1000
  // 修复之前 min >10000 才转 K 导致 8000 和 15000 显示不一致的问题
  const normalizeToK = (val: number): number => {
    if (val > 1000) return Math.round(val / 1000);
    return val;
  };

  const minK = min ? normalizeToK(min) : null;
  const maxK = max ? normalizeToK(max) : null;

  if (minK && maxK) {
    return `${minK}-${maxK}K`;
  } else if (minK) {
    return `${minK}K+`;
  } else if (maxK) {
    return `≤${maxK}K`;
  }

  return "薪资面议";
}

export function formatSalaryDetail(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) {
    return "薪资面议";
  }
  
  const formatNum = (num: number) => num.toLocaleString("zh-CN");
  
  if (min && max) {
    return `${formatNum(min)}-${formatNum(max)}元/月`;
  } else if (min) {
    return `${formatNum(min)}元/月起`;
  } else if (max) {
    return `${formatNum(max)}元/月以下`;
  }
  
  return "薪资面议";
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function safeJsonLdStringify(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function ensureHttpProtocol(url: string | null | undefined): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}
