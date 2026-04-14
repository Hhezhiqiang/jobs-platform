import { config } from "dotenv";
config({ override: true });
import { PageType, PageStatus } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";
import { llmChat, isLLMConfigured } from "../src/lib/llm";

// ==================== 类型定义 ====================

interface BlogTopic {
  title: string;
  targetLength: number;
  keywords: string[];
  priority?: number;
}

interface BlogCategory {
  name: string;
  keywords: string[];
  topics: BlogTopic[];
}

interface GeneratedSection {
  heading: string;
  content: string;
}

interface ContentCheckResult {
  passed: boolean;
  wordCount: number;
  h2Count: number;
  metaDescLength: number;
  keywordDensity: number;
  internalLinkCount: number;
  imageCount: number;
  issues: string[];
}

// ==================== 配置 ====================

const MODE = process.env.BLOG_GEN_MODE || "standard";
const MIN_WORD_COUNT = MODE === "long" ? 5000 : 3000;
const TARGET_WORD_COUNT = MODE === "long" ? 6000 : 4500;
const MAX_WORD_COUNT = MODE === "long" ? 7000 : 5500;
const MIN_H2_COUNT = 4;
const OPTIMAL_KEYWORD_DENSITY = 0.015; // 1.5%

// ==================== 工具函数 ====================

function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${base}-${timestamp}`;
}

function generateCoverImage(category: string): string {
  const coverMap: Record<string, string> = {
    "前端开发": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop",
    "后端开发": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop",
    "产品经理": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=600&fit=crop",
    "数据分析师": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    "UI/UX设计": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop",
    "运营": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
    "算法工程师": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop",
    "测试工程师": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop",
    "求职通用": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop",
    "职场发展": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop",
    "全职招聘": "https://images.unsplash.com/photo-1521791136064-79845b86dc94?w=1200&h=600&fit=crop",
    "人力资源": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&h=600&fit=crop",
    "销售与市场": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
    "财务与审计": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop",
    "法务与合规": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&h=600&fit=crop",
    "客户服务": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=600&fit=crop",
    "供应链与采购": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop",
    "医疗与健康": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
    "教育与培训": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop",
    "公务员与事业单位": "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1200&h=600&fit=crop",
    "咨询与战略": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop",
    "制造业与工程": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=600&fit=crop",
    "建筑与房地产": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=600&fit=crop",
    "物流与运输": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=600&fit=crop",
    "意想不到的话题": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop",
  };
  return coverMap[category] || coverMap["求职通用"];
}

async function getJobsBroUser(): Promise<string> {
  const user = await prisma.users.findFirst({ where: { email: "jobsbro@jobsbor.com" } });
  if (user) return user.id;
  const newUser = await prisma.users.create({
    data: { email: "jobsbro@jobsbor.com", name: "JobsBro", password: "", role: "ADMIN", status: "ACTIVE" },
  });
  return newUser.id;
}

function estimateChineseChars(text: string): number {
  // 估算中文字符数（包括标点）
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const numbers = (text.match(/\d+/g) || []).length;
  return chineseChars + Math.floor(englishWords / 2) + numbers;
}

async function callAI(prompt: string, maxTokens = 8000): Promise<string> {
  if (!isLLMConfigured()) {
    throw new Error("未配置LLM API Key");
  }
  
  const maxRetries = 3;
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await llmChat(
        [{ role: "user", content: prompt }],
        { temperature: 0.7, maxTokens }
      );
    } catch (err) {
      lastError = err as Error;
      const msg = lastError.message;
      if (msg.includes("429") || msg.includes("overloaded") || msg.includes("rate limit")) {
        const delay = (i + 1) * 5000;
        console.log(`[smart-gen] AI请求被限制，${delay / 1000}秒后重试(${i + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }
  }
  
  throw lastError || new Error("LLM调用失败，已重试3次");
}

async function translateToEn(text: string): Promise<string> {
  const prompt = `将以下中文博客文章翻译成地道的美式英语职场博客风格。要求：
1. 保持 Markdown 格式和结构不变；
2. 语气专业、亲切，像 LinkedIn 或 Medium 上的高质量职场文章；
3. 保留所有的 ##、###、** 等 Markdown 标记；
4. 公司名称、产品名称等专有名词可适当保留拼音或英文通用译法；
5. 直接输出英文译文，不要有任何额外说明。

原文如下：
${text}`;
  return await callAI(prompt, 16000);
}

// ==================== 选题策略 ====================

async function selectTopic(): Promise<{
  title: string;
  category: string;
  keywords: string[];
  targetLength: number;
  source: "hot_keyword" | "topic_library";
  hotKeyword?: string;
}> {
  // 1. 获取数据库中的高热词
  const hotKeywords = await prisma.keyword_monitors.findMany({
    where: {
      category: { in: ["PRIMARY", "TRAFFIC"] },
      trendScore: { gte: 60 },
      status: { not: "PUBLISHED" },
    },
    orderBy: { trendScore: "desc" },
    take: 10,
  });

  // 2. 读取选题库
  const topicsPath = join(process.cwd(), "memory", "blog-topics.json");
  const topicsData: { categories: BlogCategory[] } = JSON.parse(
    readFileSync(topicsPath, "utf-8")
  );

  // 3. 策略：如果有高热词且与选题库匹配，优先生成热点内容
  if (hotKeywords.length > 0 && Math.random() > 0.3) {
    const hotKeyword = hotKeywords[0];
    
    // 尝试匹配选题库
    for (const cat of topicsData.categories) {
      for (const topic of cat.topics) {
        const allKeywords = [...cat.keywords, ...topic.keywords];
        if (allKeywords.some(k => 
          hotKeyword.keyword.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(hotKeyword.keyword.toLowerCase())
        )) {
          return {
            title: `${topic.title}（${hotKeyword.keyword}趋势解读）`,
            category: cat.name,
            keywords: [...new Set([...allKeywords, hotKeyword.keyword, hotKeyword.normalized])],
            targetLength: Math.max(topic.targetLength, 4000),
            source: "hot_keyword",
            hotKeyword: hotKeyword.keyword,
          };
        }
      }
    }

    // 如果没匹配到，基于热词生成新标题（使用多样化模板避免重复）
    const randomCat = topicsData.categories[Math.floor(Math.random() * topicsData.categories.length)];
    
    // 多样化标题模板
    const titleTemplates = [
      `${hotKeyword.keyword}完全指南：从入门到精通的实战攻略`,
      `${hotKeyword.keyword}2026趋势报告：行业现状与未来发展`,
      `${hotKeyword.keyword}实战经验分享：高薪从业者的成功秘诀`,
      `${hotKeyword.keyword}避坑指南：新手最容易犯的10个错误`,
      `${hotKeyword.keyword}进阶之路：3个月实现职业突破的关键策略`,
      `2026年${hotKeyword.keyword}最新攻略：HR和面试官都在关注什么`,
      `${hotKeyword.keyword}全景分析：市场需求、薪资待遇与技能要求`,
      `${hotKeyword.keyword}高效准备法：用最少时间获得最大提升`,
    ];
    
    // 随机选择一个标题模板
    const randomTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    
    return {
      title: randomTitle,
      category: randomCat.name,
      keywords: [hotKeyword.keyword, hotKeyword.normalized, ...randomCat.keywords.slice(0, 5)],
      targetLength: 4500,
      source: "hot_keyword",
      hotKeyword: hotKeyword.keyword,
    };
  }

  // 4.  fallback：从选题库随机选题
  const randomCategory = topicsData.categories[Math.floor(Math.random() * topicsData.categories.length)];
  const randomTopic = randomCategory.topics[Math.floor(Math.random() * randomCategory.topics.length)];

  return {
    title: randomTopic.title,
    category: randomCategory.name,
    keywords: [...randomCategory.keywords, ...randomTopic.keywords],
    targetLength: Math.max(randomTopic.targetLength, MODE === "long" ? 5000 : 3500),
    source: "topic_library",
  };
}

async function checkRecentSimilarContent(keywords: string[]): Promise<boolean> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = await prisma.pages.findMany({
    where: { type: "BLOG", createdAt: { gte: sevenDaysAgo } },
    select: { keywords: true },
  });
  for (const post of recentPosts) {
    const postKeywords = post.keywords || [];
    const overlap = keywords.filter((k) =>
      postKeywords.some(
        (pk: string) =>
          pk.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(pk.toLowerCase())
      )
    );
    if (overlap.length >= 2) return true;
  }
  return false;
}

// 检查标题是否已存在（完全重复检查）
async function checkDuplicateTitle(title: string): Promise<boolean> {
  const existing = await prisma.pages.findFirst({
    where: { type: "BLOG", title: title },
    select: { id: true },
  });
  return !!existing;
}

// ==================== 内容生成核心 ====================

async function generateOutline(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<string> {
  const prompt = `请以资深SEO内容策略师+职场专家的身份，为以下标题撰写一份搜索引擎友好、深度专业的博客大纲。

【文章标题】${title}
【所属分类】${category}
【目标字数】${targetLength}汉字（必须达到）
【核心关键词】${keywords.join("、")}

要求：
1. 结构必须包含：引言、4-6个核心章节（每章2-3个小节）、实操建议/SOP、FAQ常见问题、总结与CTA
2. 每章标题必须自然融入1-2个关键词
3. 内容要有专业深度和独到见解，拒绝泛泛而谈
4. 要符合SEO最佳实践：H2标题包含问题形式、列表形式、数字形式等
5. 只输出纯大纲，不要输出任何正文。使用Markdown格式。

输出格式示例：
# ${title}

## 引言

## 第一章：... 
### 1.1 ...
### 1.2 ...

## 第二章：...
...

## 实操建议：...

## 常见问题（FAQ）

## 总结
`;

  return await callAI(prompt, 4000);
}

async function generateSectionContent(
  outline: string,
  sectionTitle: string,
  sectionIndex: number,
  totalSections: number,
  category: string,
  keywords: string[],
  targetLength: number,
  previousContent?: string
): Promise<string> {
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === totalSections - 1;
  
  const partMin = Math.floor(targetLength / totalSections);
  
  let contextHint = "";
  if (previousContent) {
    contextHint = `\n\n前文摘要（请保持风格连贯）：\n${previousContent.slice(-500)}`;
  }

  const prompt = `请根据以下大纲，撰写【${sectionTitle}】的完整正文。

【文章标题】从大纲中获取
【所属分类】${category}
【核心关键词】${keywords.join("、")}
【本部分字数要求】不少于${partMin}字
【本部分在全文中的位置】${isFirst ? "开篇" : isLast ? "结尾" : "中间"}

大纲：
${outline}

写作要求：
1. 只输出【${sectionTitle}】的正文，不要输出其他章节
2. 使用Markdown格式，章节标题用##，小标题用###
3. 内容详实，每个小节不少于300字，必须有具体案例、数据支撑或实战经验
4. 如果是FAQ章节，必须包含3-5个Q&A对，格式为 **Q: 问题** \n\n A: 回答
5. 如果是实操建议章节，必须给出具体可执行的步骤清单（1. 2. 3.）
6. 自然融入关键词，避免堆砌
7. 语言专业但不晦涩，适合职场人士阅读
8. 多使用列表、表格、引用块等Markdown元素增强可读性
${contextHint}

请直接输出该章节的完整正文。`;

  return await callAI(prompt, 8000);
}

async function generateBlogContentLong(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<{ content: string; excerpt: string; metaDescription: string }> {
  try {
    console.log("[smart-gen] 正在生成大纲...");
    const outline = await generateOutline(title, category, keywords, targetLength);
    
    // 解析大纲中的章节
    const sectionMatches = outline.match(/^##\s+(.+)$/gm) || [];
    const sections = sectionMatches.map(m => m.replace(/^##\s+/, "")).filter(s => s.trim());
    
    if (sections.length < MIN_H2_COUNT) {
      throw new Error(`大纲章节数不足：${sections.length}，需要至少${MIN_H2_COUNT}`);
    }

    console.log(`[smart-gen] 大纲生成完成，共${sections.length}个章节，开始分章节写作...`);

    const sectionContents: string[] = [];
    let previousContent = "";

    for (let i = 0; i < sections.length; i++) {
      console.log(`[smart-gen] 正在生成第${i + 1}/${sections.length}章：${sections[i]}...`);
      const sectionContent = await generateSectionContent(
        outline,
        sections[i],
        i,
        sections.length,
        category,
        keywords,
        targetLength,
        previousContent
      );
      sectionContents.push(`## ${sections[i]}\n\n${sectionContent.trim()}`);
      previousContent += sectionContent;
    }

    let content = `# ${title}\n\n${sectionContents.join("\n\n")}`;
    
    // 字数检查与补充
    const currentChars = estimateChineseChars(content);
    if (currentChars < targetLength * 0.85) {
      console.log(`[smart-gen] 字数不足（${currentChars}/${targetLength}），正在补充内容...`);
      const supplement = await generateSupplement(content, title, category, keywords, targetLength - currentChars);
      content += "\n\n" + supplement;
    }

    const excerpt = content
      .replace(/#.*?\n/g, "")
      .replace(/\*\*/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .slice(0, 200)
      .trim();
    
    const metaDescription = excerpt.slice(0, 160);
    
    return { content, excerpt, metaDescription };
  } catch (error) {
    console.error("[smart-gen] AI长文生成失败:", error);
    throw error;
  }
}

async function generateSupplement(
  existingContent: string,
  title: string,
  category: string,
  keywords: string[],
  deficit: number
): Promise<string> {
  const prompt = `以下是一篇博客文章的已有内容，但字数还差约${deficit}字。请为其补充一个"深度延伸"章节，放在文章末尾。

【文章标题】${title}
【所属分类】${category}
【核心关键词】${keywords.join("、")}
【需要补充字数】约${deficit}字

已有内容摘要：
${existingContent.slice(0, 1500)}...

要求：
1. 补充内容以 ## 深度延伸：${category}的进阶思考 为标题
2. 包含2-3个小节，每节不少于400字
3. 内容要有新的视角、新的案例，不能与已有内容重复
4. 直接输出补充的Markdown内容
`;
  return await callAI(prompt, 6000);
}

// ==================== SEO增强 ====================

async function generateInternalLinks(content: string, keywords: string[]): Promise<{ text: string; url: string }[]> {
  // 从数据库获取相关文章
  const relatedPages = await prisma.pages.findMany({
    where: {
      type: "BLOG",
      status: "PUBLISHED",
      keywords: { hasSome: keywords },
    },
    select: { title: true, slug: true, keywords: true },
    take: 10,
  });

  const links: { text: string; url: string }[] = [];
  
  for (const page of relatedPages) {
    if (links.length >= 5) break;
    const matchKeyword = page.keywords?.find((k: string) => 
      content.includes(k) && k.length > 2
    );
    if (matchKeyword) {
      links.push({
        text: page.title,
        url: `/blog/${page.slug}`,
      });
    }
  }

  // 平台内链
  const platformLinks = [
    { text: "查看最新职位", url: "/jobs" },
    { text: "薪资洞察报告", url: "/salary-insights" },
    { text: "职场专题", url: "/topics" },
  ];
  
  // 根据关键词定制内链
  if (keywords.some(k => ["Java", "前端", "后端", "算法", "测试"].includes(k))) {
    platformLinks.push({ text: "技术岗位招聘", url: "/jobs?keyword=技术" });
  }
  if (keywords.some(k => ["产品经理", "运营", "设计"].includes(k))) {
    platformLinks.push({ text: "产品运营岗位", url: "/jobs?keyword=产品" });
  }

  // 去重并合并
  const existingUrls = new Set(links.map(l => l.url));
  for (const pl of platformLinks) {
    if (!existingUrls.has(pl.url) && links.length < 5) {
      links.push(pl);
    }
  }

  return links;
}

function insertInternalLinks(content: string, links: { text: string; url: string }[]): string {
  let result = content;
  
  for (const link of links) {
    // 尝试在内容中找到一个自然的位置插入链接
    // 策略：找到与链接文本相关的句子，将其中的关键词替换为链接
    const sentences = result.split(/(?<=[。！？.!?])\s*/);
    for (let i = 0; i < sentences.length; i++) {
      if (sentences[i].includes(link.text.slice(0, 4)) || sentences[i].includes(link.text.slice(-4))) {
        sentences[i] += ` [了解更多：${link.text}](${link.url})`;
        result = sentences.join("");
        break;
      }
    }
  }

  // 如果还没插入够，在文末添加相关阅读
  if (links.length > 0) {
    const linkList = links.map(l => `- [${l.text}](${l.url})`).join("\n");
    result += `\n\n---\n\n## 推荐阅读\n\n${linkList}`;
  }

  return result;
}

function optimizeImages(content: string, title: string): string {
  // 为文章中的引用图片添加描述性alt文本
  // 目前封面图已在外部处理，这里可以插入一些数据可视化占位图
  return content;
}

function generateFAQSchema(content: string): { question: string; answer: string }[] | null {
  const faqMatch = content.match(/##\s+(FAQ|常见问题)[\s\S]*?(?=##\s+|$)/i);
  if (!faqMatch) return null;

  const faqs: { question: string; answer: string }[] = [];
  const qaMatches = faqMatch[0].matchAll(/\*\*Q[:：]?\s*(.+?)\*\*[\s\S]*?A[:：]?\s*(.+?)(?=\*\*Q[:：]?|$)/gi);
  
  for (const match of qaMatches) {
    if (match[1] && match[2]) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim().replace(/\n/g, " "),
      });
    }
  }

  return faqs.length > 0 ? faqs : null;
}

// ==================== 质量检查 ====================

function runContentCheck(content: string, metaDesc: string, keywords: string[]): ContentCheckResult {
  const wordCount = estimateChineseChars(content);
  const h2Count = (content.match(/^##\s+/gm) || []).length;
  const metaDescLength = metaDesc.length;
  
  // 计算关键词密度
  const contentLower = content.toLowerCase();
  let keywordOccurrences = 0;
  for (const kw of keywords) {
    const regex = new RegExp(kw.toLowerCase(), "g");
    keywordOccurrences += (contentLower.match(regex) || []).length;
  }
  const keywordDensity = wordCount > 0 ? keywordOccurrences / wordCount : 0;
  
  // 统计内链数量
  const internalLinkCount = (content.match(/\]\(\/[^)]+\)/g) || []).length;
  
  // 统计图片数量
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

  const issues: string[] = [];
  if (wordCount < MIN_WORD_COUNT) issues.push(`字数不足：${wordCount} < ${MIN_WORD_COUNT}`);
  if (h2Count < MIN_H2_COUNT) issues.push(`H2标题不足：${h2Count} < ${MIN_H2_COUNT}`);
  if (metaDescLength < 120 || metaDescLength > 160) issues.push(`Meta描述长度不合适：${metaDescLength}`);
  if (keywordDensity < 0.005 || keywordDensity > 0.05) issues.push(`关键词密度异常：${(keywordDensity * 100).toFixed(2)}%`);
  if (internalLinkCount < 2) issues.push(`内链数量不足：${internalLinkCount} < 2`);

  return {
    passed: issues.length === 0,
    wordCount,
    h2Count,
    metaDescLength,
    keywordDensity,
    internalLinkCount,
    imageCount,
    issues,
  };
}

// ==================== 搜索引擎推送 ====================

async function notifySearchEngines(slug: string): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";
  const url = `${siteUrl}/blog/${slug}`;
  
  try {
    // Google Indexing API（需要配置服务账号）
    // 这里仅记录，实际推送需要额外配置
    console.log(`[seo-push] 待推送URL（Google）: ${url}`);
  } catch (e) {
    console.error("[seo-push] Google推送失败:", e);
  }

  try {
    // Bing URL Submission
    await fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent(url)}`, { method: "GET" });
    console.log(`[seo-push] Bing推送完成: ${url}`);
  } catch (e) {
    console.error("[seo-push] Bing推送失败:", e);
  }
}

// ==================== 主流程 ====================

export async function createSmartBlogPost(): Promise<{
  success: boolean;
  post?: { id: string; title: string; slug: string };
  check?: ContentCheckResult;
  error?: string;
}> {
  try {
    console.log(`[smart-gen] ====== 开始智能博客生成 [模式: ${MODE}] ======`);
    
    // 1. 选题
    const topic = await selectTopic();
    const finalTargetLength = Math.min(
      Math.max(topic.targetLength, MIN_WORD_COUNT),
      MAX_WORD_COUNT
    );
    console.log(`[smart-gen] 选中主题: ${topic.title} (来源: ${topic.source}, 目标字数: ${finalTargetLength})`);

    // 2. 去重检查
    const isSimilar = await checkRecentSimilarContent(topic.keywords);
    if (isSimilar) {
      console.log("[smart-gen] 近期有类似内容，跳过本次生成");
      return { success: false, error: "similar_content_exists" };
    }

    // 2.5 标题重复检查
    const isDuplicate = await checkDuplicateTitle(topic.title);
    if (isDuplicate) {
      console.log("[smart-gen] 标题已存在，跳过本次生成");
      return { success: false, error: "duplicate_title_exists" };
    }

    // 3. 获取作者
    const authorId = await getJobsBroUser();

    // 4. 生成长文内容
    console.log("[smart-gen] 开始生成长文内容...");
    const zh = await generateBlogContentLong(
      topic.title,
      topic.category,
      topic.keywords,
      finalTargetLength
    );

    // 5. 生成内链
    console.log("[smart-gen] 正在生成内链...");
    const internalLinks = await generateInternalLinks(zh.content, topic.keywords);
    const contentWithLinks = insertInternalLinks(zh.content, internalLinks);

    // 6. 翻译英文版（带降级处理）
    console.log("[smart-gen] 中文内容生成完成，正在翻译英文版...");
    let contentEn: string;
    let excerptEn: string;
    let metaDescriptionEn: string;
    
    try {
      contentEn = await translateToEn(contentWithLinks);
      excerptEn = contentEn
        .replace(/#.*?\n/g, "")
        .replace(/\*\*/g, "")
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .slice(0, 200)
        .trim();
      metaDescriptionEn = excerptEn.slice(0, 160);
      console.log("[smart-gen] 英文翻译完成");
    } catch (err) {
      console.log("[smart-gen] 英文翻译失败，使用中文内容作为降级方案");
      contentEn = contentWithLinks;
      excerptEn = zh.excerpt;
      metaDescriptionEn = zh.metaDescription.slice(0, 160);
    }

    // 7. 质量检查
    const check = runContentCheck(contentWithLinks, zh.metaDescription, topic.keywords);
    console.log("[smart-gen] 质量检查结果:", check);
    
    if (!check.passed) {
      console.warn("[smart-gen] 内容检查未完全通过:", check.issues);
      // 不阻塞发布，但记录问题
    }

    // 8. 生成Slug和封面
    const slug = generateSlug(topic.title);
    const featuredImage = generateCoverImage(topic.category);

    // 9. 保存到数据库
    const post = await prisma.pages.create({
      data: {
        title: topic.title,
        slug,
        excerpt: zh.excerpt,
        content: contentWithLinks,
        excerptEn,
        contentEn,
        type: PageType.BLOG,
        status: PageStatus.PUBLISHED,
        featuredImage,
        keywords: topic.keywords,
        metaTitle: topic.title,
        metaDescription: zh.metaDescription,
        metaDescriptionEn,
        authorId,
        viewCount: 0,
      },
    });

    // 10. 更新热词状态（如果是基于热词生成的）
    if (topic.source === "hot_keyword" && topic.hotKeyword) {
      await prisma.keyword_monitors.updateMany({
        where: { keyword: topic.hotKeyword },
        data: { status: "PUBLISHED" },
      });
    }

    // 11. 推送搜索引擎
    await notifySearchEngines(slug);

    console.log(`[smart-gen] 博客文章创建成功: ${post.title}`);
    console.log(`[smart-gen] URL: /blog/${post.slug}`);
    console.log(`[smart-gen] 字数: 中文 ${check?.wordCount || 0} / 英文 ${estimateChineseChars(contentEn)}`);

    return { success: true, post, check };
  } catch (error) {
    console.error("[smart-gen] 创建博客失败:", error);
    return { success: false, error: String(error) };
  }
}

// CLI入口
if (require.main === module) {
  createSmartBlogPost()
    .then((result) => {
      if (result.success) {
        console.log("✅ 智能博客生成成功", result.post);
        process.exit(0);
      } else {
        console.log("⚠️ 智能博客生成失败:", result.error);
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("执行失败:", error);
      process.exit(1);
    });
}
