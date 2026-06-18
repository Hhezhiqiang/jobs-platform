#!/bin/bash
# ============================================================
# SEO 全面修复部署脚本
# ============================================================
set -e
export HOME=/root
cd /opt/jobs-platform

echo "=== SEO Fix Deployment ==="

# 1. 下载更新文件
echo "[1/4] Downloading updated files..."
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/lib/auto-blog-generator.ts -o src/lib/auto-blog-generator.ts
echo "  auto-blog-generator.ts updated"

# 2. 修复百度/Google验证文件
echo "[2/4] Fixing verification files..."
echo "wV5u95unUV" > public/baidu_verify_code-wV5u95unUV.html
echo "google-site-verification: google1234567890abcdef.html" > public/google1234567890abcdef.html
echo "  Verification files created"

# 3. 修复现有博客的 meta 描述和关键词
echo "[3/4] Fixing existing blogs..."
cat > /tmp/fix-blogs.mjs << 'JS'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixBlogs() {
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG" },
    select: { id: true, title: true, content: true, metaDescription: true, keywords: true, slug: true },
  });
  
  console.log(`Found ${blogs.length} blogs`);
  let fixed = 0;
  
  for (const blog of blogs) {
    const updates = {};
    
    // 修复 meta 描述
    if (!blog.metaDescription || blog.metaDescription.length < 50) {
      const clean = (blog.content || "")
        .replace(/[#*>_`\-\[\]()]/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const sentences = clean.split(/[。！？\.!\?]/).filter(s => s.trim().length > 10);
      const meta = sentences.slice(0, 3).join("。") + "。";
      updates.metaDescription = meta.substring(0, 160);
      updates.metaDescriptionEn = meta.substring(0, 160);
    }
    
    // 修复关键词
    if (!blog.keywords || blog.keywords.length < 3) {
      const keywordSet = new Set();
      keywordSet.add("招聘"); keywordSet.add("求职"); keywordSet.add("薪资");
      keywordSet.add("职业发展"); keywordSet.add("面试"); keywordSet.add("简历");
      
      // 从标题提取
      const titleWords = (blog.title || "").match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      for (const w of titleWords.slice(0, 3)) keywordSet.add(w);
      
      updates.keywords = Array.from(keywordSet).slice(0, 10);
    }
    
    // 修复 metaTitle
    if (blog.slug && !blog.metaTitle) {
      // Skip - metaTitle is optional
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.pages.update({ where: { id: blog.id }, data: updates });
      fixed++;
      console.log(`  Fixed: ${blog.title.substring(0, 40)}...`);
    }
  }
  
  console.log(`Fixed ${fixed} blogs`);
  await prisma.$disconnect();
}
fixBlogs();
JS
node /tmp/fix-blogs.mjs
echo "  Existing blogs fixed"

# 4. 重新构建
echo "[4/4] Rebuilding..."
nohup bash -c "cd /opt/jobs-platform && npx next build > /tmp/seo-fix-build.log 2>&1 && pkill -f 'next start'; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "  Build started in background"
echo ""
echo "=== DONE ==="
echo "Wait 60s then check: tail -10 /tmp/seo-fix-build.log"