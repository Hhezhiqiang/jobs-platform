import { prisma } from "@/lib/prisma";
import { validateAndCleanKeywords, cleanBlogContent } from "@/lib/blog-content-validator";
import { aiChat, isAIConfigured } from "@/lib/ai-client";
import { logger } from '@/lib/logger';

const KIMI_MODEL = process.env.KIMI_MODEL || "moonshot-v1-32k";

// SEO 质量标准
const SEO_STANDARDS = {
  MIN_CONTENT_LENGTH: 800,        // 最少 800 字
  TARGET_CONTENT_LENGTH: 2000,    // 目标 2000 字
  MIN_META_DESC_LENGTH: 80,       // Meta 描述最少 80 字
  MAX_META_DESC_LENGTH: 160,      // Meta 描述最多 160 字
  MIN_KEYWORDS: 5,                // 最少 5 个关键词
  MAX_KEYWORDS: 10,               // 最多 10 个关键词
  MIN_H2_COUNT: 4,                // 至少 4 个 H2 标题
  FORBIDDEN_PHRASES: [
    "总的来说", "综上所述", "在当今快速发展的时代",
    "不容忽视", "众所周知", "由此可见", "总之",
    "在当今竞争激烈的", "随着科技的不断发展",
  ],
};

/**
 * 构建 SEO 优化的 AI 提示词
 */
function buildSEOPrompt(keyword: string, archives: string[]): string {
  const archiveContext = archives.length > 0
    ? `以下是与"${keyword}"相关的行业动态参考：\n${archives.slice(0, 5).join("\n\n")}`
    : `请围绕"${keyword}"这个关键词撰写一篇深度职业/求职类文章。`;

  return `你是一位拥有 15 年经验的资深 HR 总监和职业咨询师，曾任职于多家头部互联网公司和猎头公司。擅长撰写数据驱动、有深度、可操作的职业发展文章。

请为 JobQuip 招聘平台撰写一篇关于"${keyword}"的专业深度文章。

${archiveContext}

📋 文章结构要求（必须包含所有部分）：

## 一、行业现状与趋势
- 用具体数据说明 2025-2026 年的市场情况（必须包含具体数字，如薪资范围、岗位数量、增长率等）
- 分析当前人才供需关系
- 至少引用 2-3 个行业趋势或数据点

## 二、核心岗位与技能要求
- 列出该领域最热门的 3-5 个岗位
- 每个岗位详细说明技能要求（硬技能+软技能）、经验要求
- 用具体的工作内容/技术栈来描述，不要泛泛而谈

## 三、薪资水平与市场行情
- 分级别列出薪资范围（初级/中级/高级/专家级）
- 说明影响薪资的关键因素（城市、技术栈、公司规模等）
- 如有远程/海外机会，也要提及

## 四、求职路径与实战建议
- 给出具体的求职渠道和平台推荐
- 面试常见问题及回答思路（至少 3 个具体问题）
- 简历优化建议（至少 2 条实用建议）
- 2-3 个可立即执行的行动建议

## 五、职业发展与长期规划
- 3-5 年职业发展路径图
- 转型/进阶路线建议
- 关键的学习资源和认证推荐

✍️ 写作要求：
1. 每个观点都要有数据或案例支持
2. 语言直接、实用、接地气，像一位前辈在跟你分享经验
3. 每段不超过 5 行，多使用列表、加粗来组织信息
4. 全文字数 2000-3500 字
5. 使用 Markdown 格式，标题用 ## 和 ###
6. 禁止使用"总的来说""综上所述""众所周知"等陈词滥调

📝 SEO 要求：
- 标题中自然包含核心关键词"${keyword}"
- 关键词密度控制在 2-3%，不要堆砌
- 正文第一段就出现核心关键词
- 文章末尾用一句话介绍 JobQuip 平台（不超过 30 字）

请直接输出文章内容，不要任何前言或后记。`;
}

/**
 * 提取标题和内容
 */
function extractTitleAndContent(raw: string): { title: string; content: string } {
  const lines = raw.split("\n").map(line => line.trim()).filter(Boolean);
  let title = "";
  const contentStart = lines.findIndex(line => !line.startsWith("#"));

  // 尝试从开头提取标题
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].replace(/^#+\s*/, "").trim();
    if (line.length > 5 && line.length < 80) {
      title = line;
      break;
    }
  }

  const content = lines.slice(contentStart > 0 ? contentStart : 0).join("\n\n");
  return { title: title || "未命名文章", content };
}

/**
 * 生成 SEO 优化的 meta 描述
 */
function generateMetaDescription(content: string, keyword: string): string {
  // 从内容中提取前 2-3 句话作为 meta 描述
  const clean = content
    .replace(/[#*>_`\-\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // 按句号分割，取前 2-3 句
  const sentences = clean.split(/[。！？\.!\?]/).filter(s => s.trim().length > 10);
  let meta = sentences.slice(0, 3).join("。") + "。";
  
  // 确保包含关键词
  if (!meta.includes(keyword) && meta.length > 50) {
    meta = keyword + "——" + meta;
  }
  
  // 截断到 160 字
  return meta.substring(0, 160);
}

/**
 * 生成 SEO 关键词列表
 */
function generateSEOKeywords(keyword: string, content: string): string[] {
  const keywords = new Set<string>();
  keywords.add(keyword);
  
  // 从内容中提取高频词
  const wordMap = new Map<string, number>();
  const words = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  for (const w of words) {
    wordMap.set(w, (wordMap.get(w) || 0) + 1);
  }
  
  // 过滤停用词，取高频词
  const stopWords = new Set(["可以", "需要", "我们", "一个", "这个", "他们", "自己", "什么", "没有", "如果", "因为", "所以", "但是", "而且", "或者", "然后", "这些", "那些", "一些", "更多", "如何", "通过", "使用", "进行", "提供", "包括", "主要", "非常", "比较"]);
  const sorted = Array.from(wordMap.entries())
    .filter(([w]) => !stopWords.has(w) && w !== keyword)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
  
  sorted.forEach(w => keywords.add(w));
  
  // 添加常青关键词
  const evergreen = ["招聘", "求职", "薪资", "职业发展", "面试", "简历"];
  evergreen.forEach(w => keywords.add(w));
  
  return Array.from(keywords).slice(0, 10);
}

/**
 * 评估内容质量
 */
function evaluateContentQuality(content: string, keyword: string): { 
  score: number; 
  issues: string[];
  needsRewrite: boolean;
} {
  const issues: string[] = [];
  let score = 100;
  
  const cleanContent = content.replace(/[#*>_`\-\[\]()\s]/g, "");
  const length = cleanContent.length;
  
  if (length < SEO_STANDARDS.MIN_CONTENT_LENGTH) {
    issues.push(`内容太短(${length}字)，需要至少${SEO_STANDARDS.MIN_CONTENT_LENGTH}字`);
    score -= 30;
  }
  
  const h2Count = (content.match(/^##\s/gm) || []).length;
  if (h2Count < SEO_STANDARDS.MIN_H2_COUNT) {
    issues.push(`H2标题不足(${h2Count}个)，需要至少${SEO_STANDARDS.MIN_H2_COUNT}个`);
    score -= 15;
  }
  
  const keywordCount = (content.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (keywordCount < 2) {
    issues.push(`关键词"${keyword}"出现次数太少`);
    score -= 10;
  }
  
  for (const phrase of SEO_STANDARDS.FORBIDDEN_PHRASES) {
    if (content.includes(phrase)) {
      issues.push(`包含禁用词: "${phrase}"`);
      score -= 5;
    }
  }
  
  return { 
    score: Math.max(score, 0), 
    issues,
    needsRewrite: score < 60
  };
}

/**
 * 为单个关键词生成博客草稿
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
          orderBy: { fetchedAt: "desc" },
        },
      },
    });

    if (!monitor) {
      return { success: false, error: "Monitor not found" };
    }

    // 去重检查
    const existingBlog = await prisma.pages.findFirst({
      where: {
        type: "BLOG",
        OR: [
          { slug: { contains: monitor.normalized || monitor.keyword } },
          { title: monitor.keyword },
          { title: { contains: monitor.keyword.substring(0, Math.min(15, monitor.keyword.length)) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingBlog) {
      return { success: true, draftId: existingBlog.id, title: existingBlog.title };
    }

    // AI 生成内容
    const archives = monitor.keyword_archives.map(
      (a) => a.contentTitle ? `## ${a.contentTitle}\n${a.contentBody}` : a.contentBody
    );
    const prompt = buildSEOPrompt(monitor.keyword, archives);
    const rawContent = await callAI(prompt);

    // 提取标题和内容
    const { title: extractedTitle, content: cleanContent } = extractTitleAndContent(rawContent);
    const title = extractedTitle || `${monitor.keyword}——2026年深度解析与求职指南`;

    // 质量评估
    const quality = evaluateContentQuality(cleanContent, monitor.keyword);

    // 如果质量不达标，尝试重新生成
    let finalContent = cleanContent;
    let finalTitle = title;
    if (quality.needsRewrite) {
      logger.warn(`[auto-blog] Quality check failed for "${monitor.keyword}", retrying...`);
      const retryContent = await callAI(prompt);
      const retry = extractTitleAndContent(retryContent);
      const retryQuality = evaluateContentQuality(retry.content, monitor.keyword);
      if (retryQuality.score > quality.score) {
        finalContent = retry.content;
        finalTitle = retry.title || finalTitle;
      }
    }

    // 生成 SEO 元数据
    const slug = `${monitor.normalized.replace(/[^\w\s\u4e00-\u9fff-]/g, "").replace(/\s+/g, "-").substring(0, 50)}-${Date.now()}`;
    const metaDescription = generateMetaDescription(finalContent, monitor.keyword);
    const keywords = generateSEOKeywords(monitor.keyword, finalContent);
    const excerpt = metaDescription.substring(0, 160);

    // 清理内容
    const safeContent = cleanBlogContent(finalContent);

    // 创建博客
    const blog = await prisma.pages.create({
      data: {
        title: finalTitle,
        slug,
        content: safeContent,
        excerpt,
        type: "BLOG",
        status: "DRAFT",
        authorId,
        metaTitle: `${finalTitle} | JobQuip - 专业招聘求职平台`,
        metaDescription,
        keywords,
        // 同步英文字段
        titleEn: finalTitle,
        contentEn: safeContent,
        metaTitleEn: `${finalTitle} | JobQuip`,
        metaDescriptionEn: metaDescription,
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
    return { success: false, error: (error as Error).message };
  }
}

async function callAI(prompt: string): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("AI API key not configured");
  }
  const content = await aiChat(
    [
      {
        role: "system",
        content: "你是 JobQuip 招聘平台的内容专家。你写的文章专业、数据丰富、可操作性强。语言直接、接地气，杜绝空话套话。",
      },
      { role: "user", content: prompt },
    ],
    {
      model: KIMI_MODEL,
      temperature: 0.7,
      maxTokens: 10000,
      maxRetries: 2,
    }
  );
  return content;
}

/**
 * 批量自动生成博客
 */
export async function runAutoBlogPipeline(newMonitorIds: string[]): Promise<{
  processed: number;
  drafted: number;
  errors: number;
  details: Array<{ keyword: string; success: boolean; title?: string; qualityScore?: number; qualityIssues?: string[]; error?: string }>;
}> {
  if (!isAIConfigured() || newMonitorIds.length === 0) {
    return { processed: 0, drafted: 0, errors: 0, details: [] };
  }

  const adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!adminUser) {
    logger.error("[auto-blog] No admin user found");
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
    } else {
      result.errors++;
      const monitor = await prisma.keyword_monitors.findUnique({ where: { id: monitorId } });
      result.details.push({
        keyword: monitor?.keyword || monitorId,
        success: false,
        error: res.error,
      });
    }

    if (newMonitorIds.length > 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return result;
}