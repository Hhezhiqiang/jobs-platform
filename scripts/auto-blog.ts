import { PageType, PageStatus } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";

// 生成唯一slug
function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${base}-${timestamp}`;
}

// 生成封面图URL（使用Unsplash相关图片）
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
  };
  return coverMap[category] || coverMap["求职通用"];
}

// 检查近期是否写过类似文章（过去7天）
async function checkRecentSimilarContent(keywords: string[]): Promise<boolean> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPosts = await prisma.page.findMany({
    where: {
      type: "BLOG",
      createdAt: { gte: sevenDaysAgo },
    },
    select: { keywords: true },
  });

  for (const post of recentPosts) {
    const postKeywords = post.keywords || [];
    const overlap = keywords.filter((k) =>
      postKeywords.some((pk: string) =>
        pk.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(pk.toLowerCase())
      )
    );
    // 如果关键词重叠超过2个，认为是相似内容
    if (overlap.length >= 2) {
      return true;
    }
  }
  return false;
}

// 获取管理员用户（JobsBro）
async function getJobsBroUser(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "jobsbro@jobsbor.com" },
  });

  if (user) return user.id;

  // 如果没有则创建
  const newUser = await prisma.user.create({
    data: {
      email: "jobsbro@jobsbor.com",
      name: "JobsBro",
      password: "",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  return newUser.id;
}

// 使用AI生成博客内容
async function generateBlogContent(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<{ content: string; excerpt: string; metaDescription: string }> {
  // 尝试使用AI API生成
  try {
    const result = await generateWithAI(title, category, keywords, targetLength);
    return result;
  } catch (error) {
    console.log("AI生成失败，使用模板生成:", error);
    return generateWithTemplate(title, category, keywords, targetLength);
  }
}

// AI生成方式
async function generateWithAI(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<{ content: string; excerpt: string; metaDescription: string }> {
  const prompt = `请以资深互联网从业者身份，撰写一篇专业、深度、实用的博客文章。

【文章标题】${title}
【所属分类】${category}
【目标字数】${targetLength}字（必须达到）
【目标读者】互联网从业者、求职者、职场人士

【关键词】${keywords.join(", ")}
要求：以上内容必须自然融入文章，不要堆砌。

【内容要求】
1. 结构清晰，使用Markdown格式
2. 包含引言、3-5个核心章节、实操建议、总结
3. 内容要有深度和洞察力，不是泛泛而谈
4. 包含具体案例、数据支撑或实战经验
5. 语言专业但不晦涩，适合目标读者阅读
6. 字数必须达到要求，内容充实

请直接输出文章内容，不需要额外说明。`;

  const apiKey = process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("未配置API Key");
  }

  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kimi-k2-5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const excerpt = content
    .replace(/#.*?\n/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 200)
    .trim();

  const metaDescription = excerpt.slice(0, 160);

  return { content, excerpt, metaDescription };
}

// 模板生成方式（备用）
function generateWithTemplate(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): { content: string; excerpt: string; metaDescription: string } {
  
  const keyWordStr = keywords.slice(0, 5).join("、");
  
  // 构建章节内容，确保字数达标
  const sectionCount = Math.floor(targetLength / 800);
  let sections = "";
  
  for (let i = 1; i <= sectionCount; i++) {
    sections += `
## 第${i}章：${category}核心要点解析

在当前的互联网行业，${keyWordStr} 已经成为从业者必须掌握的核心技能。本章将深入剖析这一领域的关键概念和实践方法。

### ${i}.1 行业现状与趋势分析

随着数字化转型的加速，${category}领域正在经历前所未有的变革。根据最新行业报告，超过78%的企业已经将相关技术纳入战略规划。这一趋势不仅改变了企业的运营方式，也为从业者带来了新的机遇和挑战。

在实际工作中，我们发现优秀的${category}人才往往具备以下特质：
- 扎实的技术功底和持续学习的能力
- 对业务场景的深刻理解和洞察力
- 良好的沟通协作能力和团队精神
- 解决问题的创新思维和执行力

### ${i}.2 实战技巧与方法论

基于多年的一线实战经验，我们总结出了一套行之有效的方法论：

**1. 系统化学习路径**
建议按照"基础理论 → 工具掌握 → 项目实战 → 深度优化"的路径进行学习。避免碎片化学习导致的知识体系不完整。

**2. 案例驱动学习法**
通过分析真实项目案例，理解理论知识在实际场景中的应用。建议每周至少深度分析2-3个行业标杆案例。

**3. 建立个人知识库**
使用Notion、Obsidian等工具建立个人知识管理系统，将学习心得、技术方案、踩坑记录系统化整理。

### ${i}.3 常见误区与避坑指南

在${category}实践中，新手常犯的错误包括：
- 过度追求新技术而忽视基础
- 缺乏业务视角，技术方案脱离实际需求
- 文档意识薄弱，知识沉淀不足
- 忽视软技能培养，团队协作效率低

针对这些问题，我们建议建立定期复盘机制，每季度对工作和学习进行一次全面审视。
`;
  }

  const content = `# ${title}

> 本文由 JobsBro 原创出品，转载请注明出处。

## 引言

在互联网行业快速发展的今天，${category}已经成为企业和个人竞争力的重要组成部分。无论你是刚入行的职场新人，还是寻求突破的资深从业者，掌握${keyWordStr}都将为你的职业发展带来显著优势。

本文将结合行业最新趋势和实战经验，为你提供一份系统、实用的${category}深度指南。我们将从理论基础、实战技巧、职业发展三个维度展开，帮助你建立完整的知识体系。
${sections}
## 实操建议：从理论到实践的转化

### 制定个人发展计划

建议按照以下步骤制定你的学习计划：

**第一步：能力评估**
- 列出当前已掌握的技能清单
- 识别与目标岗位的差距
- 确定3个月内要突破的核心能力

**第二步：资源整合**
- 筛选高质量的学习资源（课程、书籍、社区）
- 寻找行业内的导师或学习伙伴
- 加入相关的技术社区和行业组织

**第三步：实践验证**
- 参与开源项目或个人 side project
- 将所学知识应用到实际工作中
- 定期输出学习总结和技术博客

### 求职实战技巧

对于正在求职或准备跳槽的读者，以下建议可能对你有帮助：

**简历优化要点**：
- 使用STAR法则描述项目经历
- 量化成果，用数据说话
- 突出与目标岗位匹配的核心技能

**面试准备策略**：
- 研究目标公司的业务和技术栈
- 准备3-5个能体现专业深度的项目案例
- 练习行为面试题，展现软技能

**谈薪技巧**：
- 提前调研市场薪资水平
- 准备多个offer增加议价能力
- 关注总包而不仅是基本工资

## 总结

${category}是一个需要持续学习和实践的领域。希望本文的内容能够帮助你在职业道路上更进一步。记住，技术能力的提升是一个长期过程，保持耐心和热情，终将收获理想的结果。

如果你对${keyWordStr}有任何疑问，欢迎在评论区留言交流。也欢迎分享你的学习心得和实战经验，让我们一起成长。

---

**关于作者**：JobsBro 是资深互联网从业者，专注于分享互联网各岗位的深度专业知识和求职招聘经验。关注获取更多职场干货。

**相关阅读**：
- [互联网人35岁危机破解指南](#)
- [大厂面试全攻略](#)
- [薪资谈判实战技巧](#)
`;

  // 填充内容以达到目标字数
  let finalContent = content;
  while (finalContent.length < targetLength) {
    finalContent += `

## 延伸阅读与参考资料

在${category}领域，持续学习是保持竞争力的关键。以下是一些推荐的学习资源：

**在线课程**：Coursera、Udemy、极客时间等平台的相关课程
**技术社区**：GitHub、Stack Overflow、掘金、知乎等技术社区
**行业报告**：艾瑞咨询、易观分析、QuestMobile等机构的行业研究报告
**专业书籍**：《${category}实战》、《互联网从业者进阶指南》等经典著作
`;
  }

  const excerpt = finalContent
    .replace(/#.*?\n/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 200)
    .trim();

  const metaDescription = excerpt.slice(0, 160);

  return { content: finalContent, excerpt, metaDescription };
}

// 主函数：生成并发布博客
async function createBlogPost() {
  try {
    // 读取主题库
    const topicsPath = join(process.cwd(), "memory", "blog-topics.json");
    const topicsData = JSON.parse(readFileSync(topicsPath, "utf-8"));

    // 随机选择一个分类和主题
    const randomCategory =
      topicsData.categories[Math.floor(Math.random() * topicsData.categories.length)];
    const randomTopic =
      randomCategory.topics[Math.floor(Math.random() * randomCategory.topics.length)];

    console.log(`准备生成文章: ${randomTopic.title}`);

    // 检查近期是否写过类似内容
    const isSimilar = await checkRecentSimilarContent([
      ...randomCategory.keywords.slice(0, 3),
      ...randomTopic.keywords,
    ]);

    if (isSimilar) {
      console.log("检测到近期有类似内容，跳过本次生成");
      return { success: false, reason: "similar_content_exists" };
    }

    // 获取作者ID
    const authorId = await getJobsBroUser();

    // 生成内容
    console.log("正在生成文章内容...");
    const { content, excerpt, metaDescription } = await generateBlogContent(
      randomTopic.title,
      randomCategory.name,
      [...randomCategory.keywords, ...randomTopic.keywords],
      randomTopic.targetLength
    );

    // 生成slug和封面
    const slug = generateSlug(randomTopic.title);
    const featuredImage = generateCoverImage(randomCategory.name);

    // 保存到数据库
    const post = await prisma.page.create({
      data: {
        title: randomTopic.title,
        slug,
        excerpt,
        content,
        type: PageType.BLOG,
        status: PageStatus.PUBLISHED,
        featuredImage,
        keywords: [...randomCategory.keywords, ...randomTopic.keywords],
        metaTitle: randomTopic.title,
        metaDescription,
        authorId,
        viewCount: 0,
      },
    });

    console.log(`博客文章创建成功: ${post.title}`);
    console.log(`URL: /blog/${post.slug}`);
    console.log(`字数: ${content.length}`);

    return { success: true, post };
  } catch (error) {
    console.error("创建博客失败:", error);
    return { success: false, error: String(error) };
  }
}

// 执行
createBlogPost()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      console.log("跳过本次生成:", result.reason || result.error);
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("执行失败:", error);
    process.exit(1);
  });
