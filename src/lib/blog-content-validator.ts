/**
 * 博客内容校验器 — 统一校验所有博客的 keywords、Tags、meta 数据
 * 任何博客写入数据库前都必须通过此校验
 *
 * 📝 核心规则（基于 2026-04-25 修复经验）：
 * 1. 关键词不能有截断（含：后跟短词、以：结尾、长度>20、半截汉字结尾）
 * 2. 关键词不能用泛词（求职、面试、薪资等）
 * 3. Tags 行不能包含泛词"求职"
 * 4. metaTitle 不能为空
 */

// 禁止单独使用的泛词
const FORBIDDEN_GENERIC_KEYWORDS = [
  "求职", "面试", "薪资", "职业规划", "简历优化",
  "互联网", "2026", "职场", "跳槽", "简历",
];

// 截断词检测：以这些字结尾的 8-15 字符词可能是截断
const HALF_WORD_ENDINGS = new Set([
  "当", "简", "攻", "策", "职", "薪", "求", "面", "技", "规",
  "时", "如", "怎", "何", "用", "在", "从", "为", "以", "与",
  "被", "德", "靠", "的", "了", "和", "识", "别",
]);

export interface BlogValidationResult {
  valid: boolean;
  issues: string[];
  cleanedKeywords: string[];
}

/**
 * 校验并清洗博客关键词
 */
export function validateAndCleanKeywords(
  keywords: string[],
  title: string = ""
): BlogValidationResult {
  const issues: string[] = [];
  const cleaned: string[] = [];

  for (const kw of keywords) {
    let finalKw = kw;

    // 1. 检测截断词：包含"："且冒号后只有 1-4 个字符
    //    例："什么时候该跳槽：识别" → "什么时候该跳槽"
    const colonIdx = kw.indexOf("：");
    if (colonIdx !== -1) {
      const afterColon = kw.substring(colonIdx + 1).trim();
      if (afterColon.length >= 1 && afterColon.length <= 4) {
        issues.push(`关键词"${kw}"包含截断（冒号后仅"${afterColon}"），已清理`);
        finalKw = kw.substring(0, colonIdx).trim();
      } else if (afterColon.length === 0) {
        issues.push(`关键词"${kw}"以冒号结尾（截断），已清理`);
        finalKw = kw.substring(0, colonIdx).trim();
      }
    }

    // 2. 检测截断词：过长（>20字符）
    if (finalKw.length > 20) {
      issues.push(`关键词"${finalKw}"过长（${finalKw.length}字符），已截短`);
      finalKw = finalKw.substring(0, 10);
    }

    // 3. 检测截断词：半截汉字结尾（8-15 字符且以半截字结尾）
    if (
      finalKw.length > 8 &&
      finalKw.length < 15 &&
      HALF_WORD_ENDINGS.has(finalKw[finalKw.length - 1])
    ) {
      issues.push(`关键词"${finalKw}"疑似截断，已截短`);
      const short = finalKw.substring(0, Math.min(finalKw.length - 1, 10));
      if (short.length >= 3) {
        finalKw = short;
      }
    }

    // 4. 检测泛词
    if (FORBIDDEN_GENERIC_KEYWORDS.includes(finalKw)) {
      issues.push(`关键词"${finalKw}"是泛词，已移除`);
      continue;
    }

    // 通过校验
    if (finalKw.length > 0) {
      cleaned.push(finalKw);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    cleanedKeywords: [...new Set(cleaned)],
  };
}

/**
 * 清洗博客正文内容（移除 Tags 行中的泛词"求职"）
 */
export function cleanBlogContent(content: string): string {
  if (!content) return content;

  let cleaned = content;

  // 移除 Tags 行中单独的"求职"泛词（不是"海外求职"等复合词）
  cleaned = cleaned.replace(/,\s*求职\s*,/g, ", ");
  cleaned = cleaned.replace(/,\s*求职(\*?\n)/g, "$1");
  cleaned = cleaned.replace(/Tags:\s*求职\s*,\s*/gi, "Tags: ");

  // 清理多余逗号
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/Tags:\s*,\s*/gi, "Tags: ");

  return cleaned;
}

/**
 * 完整校验博客数据（keywords + content + meta）
 * 在博客写入数据库前调用
 */
export function validateBlogBeforeSave(data: {
  title: string;
  keywords: string[];
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
}): {
  valid: boolean;
  issues: string[];
  cleanedData: {
    keywords: string[];
    content: string;
    metaTitle: string;
  };
} {
  const allIssues: string[] = [];

  // 1. 校验关键词
  const kwResult = validateAndCleanKeywords(data.keywords || [], data.title);
  allIssues.push(...kwResult.issues);

  // 2. 清洗内容
  const cleanedContent = cleanBlogContent(data.content || "");

  // 3. 检查 metaTitle
  let metaTitle = data.metaTitle;
  if (!metaTitle) {
    metaTitle = `${data.title} | JobQuip`;
    allIssues.push("metaTitle 为空，已自动生成");
  }

  return {
    valid: allIssues.length === 0,
    issues: allIssues,
    cleanedData: {
      keywords: kwResult.cleanedKeywords,
      content: cleanedContent,
      metaTitle,
    },
  };
}
