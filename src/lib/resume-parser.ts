import pdfParse from "pdf-parse";

interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  education: string[];
  experience: string[];
  rawText: string;
}

/**
 * 简单的简历解析器 - 使用正则提取关键信息
 * 注意：这是一个基础实现，使用正则表达式提取信息
 * 实际项目中可以使用更强大的 NLP 库或第三方解析服务
 */
export async function parseResume(
  fileBuffer: Buffer,
  fileType: string
): Promise<ParsedResume> {
  let text = "";

  try {
    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else {
      // DOC/DOCX 文件需要额外的解析库，这里先返回空
      // 实际项目中可以使用 mammoth.js 等库解析 Word 文档
      text = "";
    }
  } catch (error) {
    console.error("解析文件失败:", error);
    text = "";
  }

  return {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: extractSkills(text),
    education: extractEducation(text),
    experience: extractExperience(text),
    rawText: text.slice(0, 5000), // 限制返回文本长度
  };
}

// 提取姓名（简单实现：假设姓名在开头或者包含"姓名"字样）
function extractName(text: string): string | undefined {
  // 尝试匹配"姓名：XXX" 或 "Name: XXX"
  const namePattern1 = /(?:姓名|Name)[：:]\s*([\u4e00-\u9fa5]{2,4}|[A-Za-z\s]{3,30})/i;
  const match1 = text.match(namePattern1);
  if (match1) return match1[1].trim();

  // 尝试匹配开头的姓名（通常是简历的第一行）
  const lines = text.split("\n").filter((line) => line.trim());
  for (const line of lines.slice(0, 5)) {
    // 匹配中文姓名（2-4个汉字）
    const chineseName = line.match(/^([\u4e00-\u9fa5]{2,4})$/);
    if (chineseName) return chineseName[1];

    // 匹配英文姓名
    const englishName = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)$/);
    if (englishName) return englishName[1];
  }

  return undefined;
}

// 提取邮箱
function extractEmail(text: string): string | undefined {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailPattern);
  return match ? match[0] : undefined;
}

// 提取手机号
function extractPhone(text: string): string | undefined {
  // 中国手机号格式
  const phonePattern = /1[3-9]\d{9}|\+86[\s-]?1[3-9]\d{9}/;
  const match = text.match(phonePattern);
  return match ? match[0] : undefined;
}

// 提取技能（基于常见技术关键词）
function extractSkills(text: string): string[] {
  const skillKeywords = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "React",
    "Vue",
    "Angular",
    "Next.js",
    "Nuxt.js",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Git",
    "Linux",
    "HTML",
    "CSS",
    "Sass",
    "Less",
    "Tailwind",
    "Bootstrap",
    "jQuery",
    "Webpack",
    "Vite",
    "GraphQL",
    "REST",
    "gRPC",
    "微服务",
    "大数据",
    "机器学习",
    "深度学习",
    "区块链",
    "Web3",
    "Solidity",
    "Smart Contract",
    "DeFi",
    "NFT",
    "产品经理",
    "项目管理",
    "数据分析",
    "UI/UX",
    "Figma",
    "Sketch",
    "Photoshop",
    "Illustrator",
    "Office",
    "Excel",
    "PPT",
    "英语",
    "日语",
    "韩语",
    "法语",
    "德语",
  ];

  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();

  for (const skill of skillKeywords) {
    // 使用单词边界匹配
    const pattern = new RegExp(
      `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    if (pattern.test(textLower)) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)]; // 去重
}

// 提取教育背景
function extractEducation(text: string): string[] {
  const educationKeywords = ["本科", "硕士", "博士", "大专", "高中", "中专"];
  const lines = text.split("\n");
  const education: string[] = [];

  for (const line of lines) {
    for (const keyword of educationKeywords) {
      if (line.includes(keyword)) {
        education.push(line.trim());
        break;
      }
    }
  }

  return education.slice(0, 5); // 最多返回5条
}

// 提取工作经历
function extractExperience(text: string): string[] {
  const experienceKeywords = ["工作", "实习", "任职", "就职", "公司", "职位", "岗位"];
  const lines = text.split("\n");
  const experience: string[] = [];

  for (const line of lines) {
    for (const keyword of experienceKeywords) {
      if (line.includes(keyword) && line.length < 100) {
        experience.push(line.trim());
        break;
      }
    }
  }

  return experience.slice(0, 5); // 最多返回5条
}
