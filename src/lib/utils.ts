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
  
  // 数据库存储单位可能是元或千分之一，需要判断
  // 如果值 > 100000，说明是以分为单位，需要除以 100000 得到 K
  // 如果值 > 10000，说明是以元为单位，需要除以 1000 得到 K
  // 如果值 <= 10000，说明已经是 K 为单位
  const normalizeToK = (val: number): number => {
    if (val > 100000) return Math.round(val / 100000); // 分 → K
    if (val > 10000) return Math.round(val / 1000);    // 元 → K  
    return val;                                         // 已是 K
  };
  
  const minK = min ? normalizeToK(min) : null;
  const maxK = max ? normalizeToK(max) : null;
  
  if (minK && maxK) {
    return `${minK}-${maxK}K`;
  } else if (minK) {
    return `${minK}K+`;
  } else if (maxK) {
    return `${maxK}K以下`;
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
