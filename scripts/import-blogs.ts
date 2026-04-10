import { PrismaClient, PageType, PageStatus, UserRole, UserStatus } from "@prisma/client";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();

// 从 Markdown 文件解析博客内容
function parseMarkdown(content: string, filename: string) {
  // 提取标题（第一个 # 后面的内容）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');
  
  // 提取摘要（引言部分）
  const excerptMatch = content.match(/##\s+引言\s*\n\n([\s\S]+?)(?=\n\n##|\n##|$)/);
  let excerpt = excerptMatch ? excerptMatch[1].slice(0, 200) : content.slice(0, 200);
  excerpt = excerpt.replace(/[#*>_`\[\]]/g, '').trim();
  
  // 提取关键词（从文件末尾的 keywords）
  const keywordsMatch = content.match(/\*\*关键词\*\*[:：]\s*(.+?)(?=\n|$)/);
  const keywords = keywordsMatch 
    ? keywordsMatch[1].split(/[,，、]/).map(k => k.trim()).filter(Boolean)
    : [];
  
  return {
    title,
    content,
    excerpt,
    keywords,
  };
}

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

// 生成封面图URL
function generateCoverImage(category: string): string {
  const coverMap: Record<string, string> = {
    "前端": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop",
    "后端": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop",
    "产品": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=600&fit=crop",
    "数据": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    "设计": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop",
    "运营": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
    "算法": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop",
    "测试": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop",
    "求职": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop",
    "职场": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop",
    "career": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop",
    "frontend": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop",
  };
  
  for (const [key, url] of Object.entries(coverMap)) {
    if (category.toLowerCase().includes(key)) return url;
  }
  return coverMap["求职"];
}

// 获取或创建 JobsBro 用户
async function getJobsBroUser() {
  const user = await prisma.user.findFirst({
    where: { email: "jobsbro@jobsbor.com" },
  });

  if (user) return user;

  return await prisma.user.create({
    data: {
      email: "jobsbro@jobsbor.com",
      name: "JobsBro",
      password: "",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

// 导入单篇博客
async function importBlog(filePath: string, authorId: string) {
  const content = readFileSync(filePath, 'utf-8');
  const filename = filePath.split('/').pop() || '';
  
  const parsed = parseMarkdown(content, filename);
  const slug = generateSlug(parsed.title);
  const featuredImage = generateCoverImage(parsed.title);
  
  // 检查是否已存在
  const existing = await prisma.page.findFirst({
    where: {
      title: parsed.title,
      type: PageType.BLOG,
    },
  });
  
  if (existing) {
    console.log(`⏭️  跳过已存在: ${parsed.title}`);
    return { success: false, reason: 'exists' };
  }
  
  const post = await prisma.page.create({
    data: {
      title: parsed.title,
      slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      type: PageType.BLOG,
      status: PageStatus.PUBLISHED,
      featuredImage,
      keywords: parsed.keywords,
      metaTitle: parsed.title,
      metaDescription: parsed.excerpt.slice(0, 160),
      authorId,
      viewCount: Math.floor(Math.random() * 1000) + 100, // 随机初始阅读量
    },
  });
  
  return { success: true, post };
}

// 批量导入
async function importAllBlogs() {
  const blogsDir = join(process.cwd(), "content", "blogs");
  
  try {
    const files = readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    
    if (files.length === 0) {
      console.log("⚠️  没有找到博客文件");
      return;
    }
    
    console.log(`\n📚 找到 ${files.length} 篇博客文件\n`);
    
    const author = await getJobsBroUser();
    console.log(`✅ 使用作者: ${author.name}\n`);
    
    const results = [];
    
    for (const file of files) {
      const filePath = join(blogsDir, file);
      const stats = statSync(filePath);
      
      console.log(`📄 导入: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      
      const result = await importBlog(filePath, author.id);
      results.push(result);
      
      if (result.success && result.post) {
        console.log(`   ✅ 成功: /blog/${result.post.slug}`);
      } else {
        console.log(`   ⏭️  ${result.reason}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n========================================`);
    console.log(`✅ 导入完成: ${successCount}/${files.length} 篇成功`);
    console.log(`========================================\n`);
    
  } catch (error) {
    console.error("❌ 导入失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
importAllBlogs();
