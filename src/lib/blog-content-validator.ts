/**
 * 博客内容校验器 — 统一校验所有博客的 keywords、Tags、meta 数据
 * 任何博客写入数据库前都必须通过此校验
 *
 * 📝 核心规则（基于 2026-04-25 修复经验）：
 * 1. 关键词不能有截断（以：结尾、长度>20、半截汉字结尾）
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
  "被", "德", "靠", "的", "了", "和", "与",
]);

export interface BlogValidationResult {
  valid: boolean;
  issues: string[];
  cleanedKeywords: string[];
}

/**
 * 校验并清洗博客关键词
 * @param keywords 原始关键词数组
 * @param title 博客标题（用于推断截断词的完整含义）
 * @returns 校验结果 + 清洗后的关键词
 */
export function validateAndCleanKeywords(
  keywords: string[],
  title: string = ""
): BlogValidationResult {
  const issues: string[] = [];
  const cleaned: string[] = [];

  for (const kw of keywords) {
    // 1. 检测截断词：以：结尾
    if (kw.endsWith("：")) {
      issues.push(`关键词"${kw}"以冒号结尾（截断）`);
      const clean = kw.split("：")[0].trim();
      if (clean.length > 0 && clean.length <= 12) {
        cleaned.push(clean);
      }
      continue;
    }

    // 2. 检测截断词：过长（>20字符）
    if (kw.length > 20) {
      issues.push(`关键词"${kw}"过长（${kw.length}字符）`);
      // 截取合理长度
      const short = kw.substring(0, 10);
      cleaned.push(short);
      continue;
    }

    // 3. 检测截断词：半截汉字结尾
    if (
      kw.length > 8 &&
      kw.length < 15 &&
      HALF_WORD_ENDINGS.has(kw[kw.length - 1])
    ) {
      issues.push(`关键词"${kw}"疑似截断（以"${kw[kw.length - 1]}"结尾）`);
      // 尝试缩短到合理长度
      const short = kw.substring(0, Math.min(kw.length - 1, 10));
      if (short.length >= 3) {
        cleaned.push(short);
      }
      continue;
    }

    // 4. 检测泛词
    if (FORBIDDEN_GENERIC_KEYWORDS.includes(kw)) {
      issues.push(`关键词"${kw}"是泛词，已移除`);
      continue;
    }

    // 通过校验
    cleaned.push(kw);
  }

  return {
    valid: issues.length === 0,
    issues,
    cleanedKeywords: [...new Set(cleaned)], // 去重
  };
}

/**
 * 清洗博客正文内容（移除 Tags 行中的泛词）
 * @param content 原始内容
 * @returns 清洗后的内容
 */
export function cleanBlogContent(content: string): string {
  if (!content) return content;

  let cleaned = content;

  // 1. 移除 Tags 行中单独的"求职"泛词
  // 匹配: "Tags: X, 求职, Y" → "Tags: X, Y"
  cleaned = cleaned.replace(/,\s*求职\s*,/g, ", ");
  // 匹配: "Tags: X, 求职*" → "Tags: X*"
  cleaned = cleaned.replace(/,\s*求职(\*?\n)/g, "$1");
  // 匹配: "Tags: 求职, X" → "Tags: X"
  cleaned = cleaned.replace(/Tags:\s*求职\s*,\s*/gi, "Tags: ");

  // 2. 清理多余的逗号和空格
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
