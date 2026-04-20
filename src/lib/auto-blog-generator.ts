/**
 * 博客内容生成器 v2 — 专业深度版
 * 核心原则：先生成草稿 → 质量检测 → 人工审核 → 发布
 * 杜绝低质量 AI 堆砌内容
 */

import { prisma } from "@/lib/prisma";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
const KIMI_MODEL = process.env.KIMI_MODEL || "moonshot-v1-32k";

// 质量阈值
const QUALITY_THRESHOLDS = {
  MIN_CONTENT_LENGTH: 1500,       // 最少 1500 字
  MIN_HEADING_COUNT: 3,           // 至少 3 个 H2 标题
  MAX_KEYWORD_DENSITY: 0.05,     // 关键词密度不超过 5%
  MIN_PARAGRAPH_COUNT: 8,         // 至少 8 个段落
  MIN_UNIQUE_WORDS_RATIO: 0.3,    // 独特词比例
  FORBIDDEN_PHRASES: [
    "总而言之", "综上所述", "在这个快速发展的时代", "随着社会的进步",
    "不可否认", "众所周知", "由此可见", "总而言之",
    "在当今日益竞争激烈的", "在这个日新月异的时代",
  ],
};

interface BlogGenerationResult {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  qualityScore: number;
  qualityIssues: string[];
}

/**
 * 构建专业级 AI 提示词
 */
function buildProfessionalPrompt(keyword: string, archives: string[], intent: string): string {
  const archiveContext = archives.length > 0
    ? `以下是关于"${keyword}"的最新行业动态和数据参考：\n${archives.slice(0, 5).join("\n\n")}`
    : `请围绕"${keyword}"这个关键词撰写一篇求职/职场专业文章。`;

  return `你是一位拥有 15 年经验的资深 HR 总监兼职业咨询师，曾在头部互联网企业和顶级猎头公司工作。你擅长撰写有深度、有数据、有案例、可操作的职业发展文章。

请为"JobQuip 招聘平台"撰写一篇关于"${keyword}"的深度专业博客文章。

${archiveContext}

▌ 文章结构（必须包含以下所有部分）：

一、行业现状与趋势
- 用具体数据说明该领域 2025-2026 年的市场状况
- 至少引用 2-3 个具体数据或趋势（可以是行业报告、调研数据）
- 说明这个领域的人才供需关系

二、核心岗位与技能要求
- 列出该领域最常见的 3-5 个岗位
- 每个岗位写出具体的技术要求/软技能要求
- 用具体工具/技术栈举例（不要泛泛而谈）

三、薪资水平与市场行情
- 给出不同经验级别的薪资范围（初级/中级/高级/专家级）
- 说明影响薪资的关键因素
- 如果有远程/海外工作机会，也要提及

四、求职路径与实战建议
- 给出具体的求职渠道和方法
- 简历中应该突出什么
- 面试中常见的问题和回答思路
- 给出 2-3 个可操作的建议

五、职业发展与长期规划
- 3-5 年后的职业发展方向
- 转岗/晋升路径
- 需要持续学习的领域

▌ 写作铁律：
1. 每个观点都要有数据或案例支撑，不要空泛论述
2. 语言直接、实用，像一位资深前辈在跟你聊
3. 避免空洞的励志话语和套话
4. 禁止使用"在这个快速发展的时代""总而言之""综上所述"等陈词滥调
5. 段落要短（不超过 5 行），用编号列表和加粗来组织信息
6. 全文 2000-3500 字
7. 用 Markdown 格式，标题层级用 ## 和 ###

▌ SEO 要求：
- 自然融入关键词"${keyword}"，密度不超过 3%
- 在标题和首段中自然地包含关键词
- 文章末尾可以提一下 JobQuip 平台的相关功能（一句话即可）

请直接输出文章正文，不要有任何前言、后记或解释。只输出 Markdown 格式的文章内容。`;
}

/**
 * 调用 KIMI API 生成内容
 */
async function callKIMI(prompt: string): Promise<string> {
  if (!KIMI_API_KEY) {
    throw new Error("KIMI_API_KEY not configured");
  }

  // 两次尝试：第一次用低温度追求质量，失败后用高温度重试
  const attempts = [
    { temperature: 0.5, model: KIMI_MODEL },
    { temperature: 0.7, model: KIMI_MODEL },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: attempt.model,
        messages: [
          {
            role: "system",
            content: "你是 JobQuip 招聘平台的资深内容专家。你的文章：数据驱动、案例丰富、建议可操作、语言直接。绝不用套话和空洞论述。",
          },
          { role: "user", content: prompt },
        ],
        temperature: attempt.temperature,
        max_tokens: 10000,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (content && content.length > 500) {
        return content;
      }
    }
  }

  throw new Error("KIMI API failed to return quality content after 2 attempts");
}

/**
 * 内容质量检测
 */
export function evaluateContentQuality(content: string, keyword: string): {
  score: number;
  issues: string[];
  passed: boolean;
} {
  const issues: string[] = [];
  let score = 100;

  // 1. 内容长度检查
  const contentLen = content.length;
  if (contentLen < QUALITY_THRESHOLDS.MIN_CONTENT_LENGTH) {
    issues.push(`内容过短（${contentLen} 字），至少需要 ${QUALITY_THRESHOLDS.MIN_CONTENT_LENGTH} 字`);
    score -= 30;
  }

  // 2. 标题结构检查
  const headingCount = (content.match(/^#{2,3}\s/gm) || []).length;
  if (headingCount < QUALITY_THRESHOLDS.MIN_HEADING_COUNT) {
    issues.push(`标题太少（${headingCount} 个），至少需要 ${QUALITY_THRESHOLDS.MIN_HEADING_COUNT} 个二级/三级标题`);
    score -= 20;
  }

  // 3. 关键词密度检查
  const plainText = content.replace(/[#*>\-`_\[\]()]/g, " ");
  const totalChars = plainText.length;
  const keywordCount = (plainText.split(keyword).length - 1);
  const keywordDensity = totalChars > 0 ? (keywordCount * keyword.length) / totalChars : 0;
  if (keywordDensity > QUALITY_THRESHOLDS.MAX_KEYWORD_DENSITY) {
    issues.push(`关键词"${keyword}"密度过高（${(keywordDensity * 100).toFixed(1)}%），超过 ${(QUALITY_THRESHOLDS.MAX_KEYWORD_DENSITY * 100).toFixed(0)}%`);
    score -= 25;
  }

  // 4. 段落数量检查
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20);
  if (paragraphs.length < QUALITY_THRESHOLDS.MIN_PARAGRAPH_COUNT) {
    issues.push(`段落太少（${paragraphs.length} 段），内容可能不够丰富`);
    score -= 15;
  }

  // 5. 禁用词汇检查
  const forbiddenFound = QUALITY_THRESHOLDS.FORBIDDEN_PHRASES.filter(phrase =>
    content.includes(phrase)
  );
  if (forbiddenFound.length > 0) {
    issues.push(`发现陈词滥调：${forbiddenFound.join("、")}`);
    score -= 10 * forbiddenFound.length;
  }

  // 6. 重复段落检测
  const paragraphHashes = new Set<string>();
  let duplicateCount = 0;
  for (const p of paragraphs) {
    const trimmed = p.trim().substring(0, 50);
    if (paragraphHashes.has(trimmed)) {
      duplicateCount++;
    }
    paragraphHashes.add(trimmed);
  }
  if (duplicateCount > 2) {
    issues.push(`发现 ${duplicateCount} 个重复段落，内容可能注水`);
    score -= 20;
  }

  // 7. 检查是否有实质性内容（数字、具体名词）
  const hasNumbers = /\d{2,}/.test(content);
  const hasLists = /[-*]\s/.test(content) || /\d+\.\s/.test(content);
  if (!hasNumbers) {
    issues.push("缺少具体数据支撑，内容可能过于泛泛");
    score -= 10;
  }
  if (!hasLists) {
    issues.push("缺少列表结构，可读性可能不够好");
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    passed: score >= 60,
  };
}

/**
 * 从内容中提取标题
 */
function extractTitleAndContent(content: string): { title: string; content: string } {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return {
      title: h1Match[1].trim(),
      content: content.replace(/^#\s+.+$/m, "").trim(),
    };
  }

  // 用第一个二级标题作为标题
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) {
    return {
      title: h2Match[1].trim(),
      content: content,
    };
  }

  return { title: "", content };
}

/**
 * 生成博客文章（存为草稿，不直接发布）
 */
export async function generateBlogDraft(
  monitorId: string,
  authorId: string
): Promise<{
  success: boolean;
  draftId?: string;
  title?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  error?: string;
}> {
  try {
    const monitor = await prisma.keyword_monitors.findUnique({
      where: { id: monitorId },
      include: {
        keyword_archives: {
          select: { contentBody: true, contentTitle: true },
          take: 10,
        },
      },
    });

    if (!monitor) {
      return { success: false, error: "Monitor not found" };
    }

    // 检查是否已有相关文章
    const existingBlog = await prisma.pages.findFirst({
      where: {
        type: "BLOG",
        slug: { contains: monitor.normalized || monitor.keyword },
      },
    });

    if (existingBlog) {
      return { success: true, draftId: existingBlog.id, title: existingBlog.title };
    }

    // 构建素材上下文
    const archives = monitor.keyword_archives.map(
      (a) => a.contentTitle ? `## ${a.contentTitle}\n${a.contentBody}` : a.contentBody
    );

    // 调用 KIMI 生成内容
    const prompt = buildProfessionalPrompt(monitor.keyword, archives, monitor.intent);
    const content = await callKIMI(prompt);

    // 提取标题和内容
    const { title: extractedTitle, content: cleanContent } = extractTitleAndContent(content);
    const title = extractedTitle || `${monitor.keyword}：2026 深度解析与求职指南`;

    // 质量检测
    const quality = evaluateContentQuality(cleanContent, monitor.keyword);

    // 生成 slug（去掉时间戳，用可读格式）
    const slugBase = monitor.normalized
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);
    const slug = `${slugBase}-2026`;

    // 生成摘要
    const excerpt = cleanContent
      .replace(/[#*>_`\-]/g, "")
      .replace(/\n+/g, " ")
      .substring(0, 160)
      .trim();

    // 关键词
    const keywords = [monitor.keyword, monitor.category, monitor.intent].filter(Boolean);

    // 存为草稿，不直接发布
    const blog = await prisma.pages.create({
      data: {
        title,
        slug,
        content: cleanContent,
        excerpt,
        type: "BLOG",
        status: "DRAFT",  // 关键：先生成草稿，人工审核
        authorId,
        metaTitle: `${title} | JobQuip`,
        metaDescription: excerpt,
        keywords,
        // 质量评分存到 keywords 字段后面（或扩展 schema）
        // 这里用 keywords 数组存储质量信息
      },
    });

    return {
      success: true,
      draftId: blog.id,
      title: blog.title,
      qualityScore: quality.score,
      qualityIssues: quality.issues,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 自动博客流水线
 */
export async function runAutoBlogPipeline(newMonitorIds: string[]): Promise<{
  processed: number;
  drafted: number;
  errors: number;
  details: Array<{ keyword: string; success: boolean; title?: string; qualityScore?: number; qualityIssues?: string[]; error?: string }>;
}> {
  if (!KIMI_API_KEY || newMonitorIds.length === 0) {
    return { processed: 0, drafted: 0, errors: 0, details: [] };
  }

  const adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!adminUser) {
    console.error("[auto-blog] No admin user found");
    return { processed: 0, drafted: 0, errors: 1, details: [] };
  }

  const result = {
    processed: 0,
    drafted: 0,
    errors: 0,
    details: [] as Array<{ keyword: string; success: boolean; title?: string; qualityScore?: number; qualityIssues?: string[]; error?: string }>,
  };

  for (const monitorId of newMonitorIds) {
    const res = await generateBlogDraft(monitorId, adminUser.id);
    result.processed++;

    if (res.success) {
      result.drafted++;
      const monitor = await prisma.keyword_monitors.findUnique({ where: { id: monitorId } });
      result.details.push({
        keyword: monitor?.keyword || monitorId,
        success: true,
        title: res.title,
        qualityScore: res.qualityScore,
        qualityIssues: res.qualityIssues,
      });
      console.log(`[auto-blog] Draft created: ${res.title} (quality: ${res.qualityScore})`);
    } else {
      result.errors++;
      const monitor = await prisma.keyword_monitors.findUnique({ where: { id: monitorId } });
      result.details.push({
        keyword: monitor?.keyword || monitorId,
        success: false,
        error: res.error,
      });
      console.error(`[auto-blog] Failed for ${monitorId}: ${res.error}`);
    }

    // 限流
    if (newMonitorIds.length > 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return result;
}
