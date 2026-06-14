/**
 * 数据清理脚本
 * 1. 删除垃圾职位
 * 2. 清理博客关键词
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== Start Data Cleanup ===");

  // 1. 删除垃圾职位 (包含 cats, err, 或者标题过长/乱码)
  console.log("\n[1] Cleaning Garbage Jobs...");
  const garbageJobs = await prisma.jobs.findMany({
    where: {
      OR: [
        { title: { contains: "cats", mode: "insensitive" } },
        { title: { contains: "err", mode: "insensitive" } },
        { title: { contains: "AI-Pilled", mode: "insensitive" } },
        { title: { contains: "404", mode: "insensitive" } },
      ]
    },
    select: { id: true, title: true }
  });

  console.log(`Found ${garbageJobs.length} garbage jobs.`);
  if (garbageJobs.length > 0) {
    await prisma.jobs.deleteMany({
      where: { id: { in: garbageJobs.map(j => j.id) } }
    });
    console.log("Deleted.");
  }

  // 2. 清理博客关键词 (长度 > 8 或者包含职位名称特征的关键词)
  console.log("\n[2] Cleaning Blog Keywords...");
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG" },
    select: { id: true, keywords: true, title: true }
  });

  let updatedBlogsCount = 0;
  const jobPatterns = /招聘|Engineer|Developer|Manager|Lead|Staff|Senior|Junior|Architect|总监|经理 | 师 | 专员/i;

  for (const blog of blogs) {
    if (!blog.keywords || blog.keywords.length === 0) continue;

    const originalCount = blog.keywords.length;
    // 保留长度 <= 8 且不包含职位特征的词，排除 PRIMARY/TRAFFIC
    const cleanKeywords = blog.keywords.filter(kw => 
      kw.length <= 8 && 
      kw !== 'PRIMARY' && 
      kw !== 'TRAFFIC' && 
      !jobPatterns.test(kw)
    );

    if (cleanKeywords.length !== originalCount) {
      await prisma.pages.update({
        where: { id: blog.id },
        data: { keywords: cleanKeywords }
      });
      updatedBlogsCount++;
      console.log(`Cleaned keywords for blog: "${blog.title.slice(0, 30)}..." (Removed ${originalCount - cleanKeywords.length} tags)`);
    }
  }
  console.log(`Updated ${updatedBlogsCount} blogs.`);

  console.log("\n=== Cleanup Finished ===");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
