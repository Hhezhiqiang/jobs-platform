/**
 * Utility functions
 */

export function safeJsonLdStringify(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function ensureHttpProtocol(url: string | null | undefined): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
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

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * 格式化薪资显示
 * @param min 最低薪资
 * @param max 最高薪资
 * @returns 格式化后的薪资字符串
 * 
 * 示例:
 * - 5000, 8000 → "5-8K"
 * - 15000, 25000 → "15-25K"
 * - null, null → "薪资面议"
 */
export function formatSalary(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) {
    return "薪资面议";
  }
  
  // 转换为K为单位（除以1000）
  const minK = min ? Math.round(min / 1000) : null;
  const maxK = max ? Math.round(max / 1000) : null;
  
  if (minK && maxK) {
    return `${minK}-${maxK}K`;
  } else if (minK) {
    return `${minK}K+`;
  } else if (maxK) {
    return `${maxK}K以下`;
  }
  
  return "薪资面议";
}

/**
 * 格式化薪资显示（详细版）
 * @param min 最低薪资
 * @param max 最高薪资
 * @returns 格式化后的薪资字符串
 * 
 * 示例:
 * - 5000, 8000 → "5,000-8,000元/月"
 * - 15000, 25000 → "15,000-25,000元/月"
 */
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
