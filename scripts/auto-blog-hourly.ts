import { PageType, PageStatus } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";

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
    if (overlap.length >= 2) {
      return true;
    }
  }
  return false;
}

async function getJobsBroUser(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "jobsbro@jobsbor.com" },
  });
  if (user) return user.id;
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

async function callAI(prompt: string, maxTokens = 8000): Promise<string> {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("未配置API Key");

  const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kimi-k2-5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API调用失败: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function generateOutline(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<string | null> {
  const prompt = `请以资深职场内容创作者身份，为以下标题撰写一份详细的博客大纲。

【文章标题】${title}
【所属分类】${category}
【目标字数】${targetLength}汉字左右（每章需充实展开）
【关键词】${keywords.join("、")}

内容要求：
1. 结构清晰，包含：引言、第一章至第六章（每章含2-3个小节）、实操建议、总结。
2. 每章标题必须自然融入1-2个关键词。
3. 内容要有专业深度和独到见解，拒绝泛泛而谈。
4. 只输出纯大纲，不要输出任何正文内容。使用Markdown格式，一级标题#，章节标题##。`;
  try {
    return await callAI(prompt, 4000);
  } catch (e) {
    console.error("大纲生成失败:", e);
    return null;
  }
}

async function generateBlogContentLong(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): Promise<{ content: string; excerpt: string; metaDescription: string }> {
  try {
    const outline = await generateOutline(title, category, keywords, targetLength);
    if (!outline) throw new Error("大纲生成失败");

    const partMin = Math.floor(targetLength / 3);

    const part1Prompt = `请根据以下大纲，撰写【引言 + 第一章至第三章】的完整正文。要求：
1. 使用Markdown格式，章节标题用##，小标题用###；
2. 内容详实，每个小节不少于300字，必须有具体案例、数据支撑或实战经验；
3. 这部分字数不低于${partMin}字；
4. 语言风格专业但不晦涩，适合职场人士阅读。

大纲如下：
${outline}

请直接输出正文。`;

    const part1 = await callAI(part1Prompt, 8000);

    const part2Prompt = `请根据以下大纲和已完成的前半部分正文，继续撰写【第四章至第六章】的完整正文。要求：
1. 使用Markdown格式，章节标题用##，小标题用###；
2. 风格必须与前文连贯一致，内容详实，每个小节不少于300字；
3. 这部分字数不低于${partMin}字；
4. 必须补充新的案例、数据或方法论，避免与前文重复。

大纲如下：
${outline}

已完成的前半部分正文如下：
${part1}

请继续输出后续正文。`;

    const part2 = await callAI(part2Prompt, 8000);

    const part3Prompt = `请根据以下大纲和已完成的正文，继续撰写【第七章（如有）、实操建议、总结】的完整正文。要求：
1. 使用Markdown格式，章节标题用##，小标题用###；
2. 风格必须与前文连贯一致，实操建议部分要给出具体可执行的步骤清单；
3. 这部分字数不低于${partMin}字；
4. 总结部分要提炼全文的3-5个核心洞察。

大纲如下：
${outline}

已完成的正文如下：
${part1}
${part2}

请继续输出后续正文。`;

    const part3 = await callAI(part3Prompt, 8000);

    let content = `${part1.trim()}\n\n${part2.trim()}\n\n${part3.trim()}`;

    // 清理重复标题
    content = content.replace(/#+\s*引言[\s\S]*?(?=##?\s*第?一?章)/i, "").trim();
    content = `# ${title}\n\n${content}`;

    // 如果字数不够targetLength的80%，用模板补充
    if (content.length < targetLength * 0.8) {
      content = padContent(content, title, category, keywords, targetLength);
    }

    const excerpt = content
      .replace(/#.*?\n/g, "")
      .replace(/\*\*/g, "")
      .slice(0, 200)
      .trim();

    const metaDescription = excerpt.slice(0, 160);

    return { content, excerpt, metaDescription };
  } catch (error) {
    console.log("AI长文生成失败，使用模板生成:", error);
    return generateWithTemplate(title, category, keywords, targetLength);
  }
}

function padContent(
  base: string,
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
) {
  const keywordStr = keywords.slice(0, 5).join("、");
  let filler = "";
  let idx = 1;
  while (base.length + filler.length < targetLength) {
    filler += `

## 深度补充${idx}：${category}的隐藏知识点

本章作为对前文内容的进一步补充，探讨${keywordStr}在实际工作场景中经常被忽视，但至关重要的细节。

### ${idx}.1 那些没人教但必须知道的行业黑话

每一个行业都有自己的语言体系，${category}也不例外。掌握这些术语不仅能帮助你更快地融入团队，还能在面试和跨部门沟通中显得更专业。

### ${idx}.2 泛行业视角下的能力迁移

无论你最终是否长期从事${category}，在这一过程中培养的数据敏感度、逻辑思维能力、项目管理经验，都将成为你职业道路上的通用货币。

### ${idx}.3 过来人的三条血淋淋的建议

1. **不要只埋头干活，要抬头看路。** 行业的变化比想象中更快，保持对市场趋势的敏感度。\n2. **建立自己的作品集或案例库。** 口头描述的能力远不及一份可视化的成果。\n3. **重视人脉的积累。** 很多时候，内部转岗或下一个Offer，都来自你曾经的同事或客户推荐。
`;
    idx++;
  }
  return base + filler;
}

function generateWithTemplate(
  title: string,
  category: string,
  keywords: string[],
  targetLength: number
): { content: string; excerpt: string; metaDescription: string } {
  const keywordStr = keywords.slice(0, 5).join("、");
  const sectionCount = Math.max(6, Math.floor(targetLength / 1000));
  let body = "";
  for (let i = 1; i <= sectionCount; i++) {
    body += `
## 第${i}章：${category}核心要点深度解析

在当前的职场环境中，${keywordStr} 已经成为从业者必须掌握的核心能力。本章将深入剖析这一领域的关键概念和实践方法。

### ${i}.1 行业现状与趋势分析

随着数字化转型的加速和经济结构的调整，${category}领域正在经历前所未有的变革。根据最新行业报告，超过72%的企业已经将相关能力建设纳入战略规划。这一趋势不仅改变了企业的运营方式，也为从业者带来了新的机遇和挑战。

在实际工作中，我们发现优秀的${category}人才往往具备以下特质：
- 扎实的专业功底和持续学习的能力
- 对业务场景的深刻理解和洞察力
- 良好的沟通协作能力和团队精神
- 解决问题的创新思维和执行力

### ${i}.2 实战技巧与方法论

基于多年的一线实战经验，我们总结出了一套行之有效的方法论：

**1. 系统化学习路径**
建议按照“基础理论 → 工具掌握 → 项目实战 → 深度优化”的路径进行学习。避免碎片化学习导致的知识体系不完整。

**2. 案例驱动学习法**
通过分析真实项目案例，理解理论知识在实际场景中的应用。建议每周至少深度分析2-3个行业标杆案例。

**3. 建立个人知识库**
使用Notion、Obsidian等工具建立个人知识管理系统，将学习心得、技术方案、踩坑记录系统化整理。

### ${i}.3 常见误区与避坑指南

在${category}实践中，新手常犯的错误包括：
- 过度追求新工具/新概念而忽视基础
- 缺乏业务视角，解决方案脱离实际需求
- 文档意识薄弱，知识沉淀不足
- 忽视软技能培养，团队协作效率低

针对这些问题，我们建议建立定期复盘机制，每季度对工作和学习进行一次全面审视。
`;
  }

  let content = `# ${title}

> 本文由 JobsBro 原创出品，转载请注明出处。

## 引言

在互联网与传统行业深度融合的今天，${category}已经成为企业和个人竞争力的重要组成部分。无论你是刚入行的职场新人，还是寻求突破的资深从业者，掌握${keywordStr}都将为你的职业发展带来显著优势。

本文将结合行业最新趋势和实战经验，为你提供一份系统、实用的${category}深度指南。我们将从理论基础、实战技巧、职业发展三个维度展开，帮助你建立完整的知识体系。
${body}
## 实操建议：从理论到实践的转化

### 制定个人发展计划

建议按照以下步骤制定你的行动计划：

**第一步：能力评估**
- 列出当前已掌握的技能清单
- 识别与目标岗位的差距
- 确定3个月内要突破的核心能力

**第二步：资源整合**
- 筛选高质量的学习资源（课程、书籍、社区）
- 寻找行业内的导师或学习伙伴
- 加入相关的专业社群和行业组织

**第三步：实践验证**
- 参与实际项目或个人 side project
- 将所学知识应用到日常工作中
- 定期输出学习总结和专业文章

### 求职与晋升实战技巧

对于正在求职或准备晋升的读者，以下建议可能对你有帮助：

**简历优化要点**：
- 使用STAR法则描述项目经历
- 量化成果，用数据说话
- 突出与目标岗位匹配的核心技能

**面试准备策略**：
- 研究目标公司的业务和技术栈
- 准备3-5个能体现专业深度的项目案例
- 练习行为面试题，展现软技能

**谈薪与晋升技巧**：
- 提前调研市场薪资水平和职级体系
- 准备业绩清单，用事实证明自己的价值
- 关注总包和长期发展空间

## 总结

${category}是一个需要持续学习和实践的领域。希望本文的内容能够帮助你在职业道路上更进一步。记住，专业能力的提升是一个长期过程，保持耐心和热情，终将收获理想的结果。

如果你对${keywordStr}有任何疑问，欢迎在评论区留言交流。也欢迎分享你的学习心得和实战经验，让我们一起成长。

---

**关于作者**：JobsBro 是资深互联网及职场从业者，专注于分享各行业各岗位的深度专业知识和求职招聘经验。关注获取更多职场干货。

**相关阅读**：
- [互联网人35岁危机破解指南](#)
- [大厂面试全攻略](#)
- [薪资谈判实战技巧](#)
`;

  while (content.length < targetLength) {
    content += `

## 延伸阅读与参考资料

在${category}领域，持续学习是保持竞争力的关键。以下是一些推荐的学习资源：

**在线课程**：Coursera、Udemy、得到、混沌学园等平台的相关课程
**专业社区**：知乎、脉脉、小红书职场板块、LinkedIn等行业社区
**行业报告**：艾瑞咨询、易观分析、QuestMobile、灼识咨询等机构的行业研究报告
**专业书籍**：《${category}实战手册》、《互联网从业者进阶指南》、《职场核心竞争力》等经典著作
`;
  }

  const excerpt = content
    .replace(/#.*?\n/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 200)
    .trim();
  const metaDescription = excerpt.slice(0, 160);
  return { content, excerpt, metaDescription };
}

async function createBlogPost() {
  try {
    const topicsPath = join(process.cwd(), "memory", "blog-topics.json");
    const topicsData = JSON.parse(readFileSync(topicsPath, "utf-8"));

    const randomCategory =
      topicsData.categories[Math.floor(Math.random() * topicsData.categories.length)];
    const randomTopic =
      randomCategory.topics[Math.floor(Math.random() * randomCategory.topics.length)];

    console.log(`[Hourly] 准备生成文章: ${randomTopic.title}`);

    const isSimilar = await checkRecentSimilarContent([
      ...randomCategory.keywords.slice(0, 3),
      ...randomTopic.keywords,
    ]);

    if (isSimilar) {
      console.log("检测到近期有类似内容，跳过本次生成");
      return { success: false, reason: "similar_content_exists" };
    }

    const authorId = await getJobsBroUser();

    console.log("正在生成长篇文章内容...");
    const { content, excerpt, metaDescription } = await generateBlogContentLong(
      randomTopic.title,
      randomCategory.name,
      [...randomCategory.keywords, ...randomTopic.keywords],
      randomTopic.targetLength
    );

    const slug = generateSlug(randomTopic.title);
    const featuredImage = generateCoverImage(randomCategory.name);

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

    console.log(`[Hourly] 博客文章创建成功: ${post.title}`);
    console.log(`[Hourly] URL: /blog/${post.slug}`);
    console.log(`[Hourly] 字数: ${content.length}`);

    return { success: true, post };
  } catch (error) {
    console.error("[Hourly] 创建博客失败:", error);
    return { success: false, error: String(error) };
  }
}

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
