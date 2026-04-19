import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 一次性数据清理 API（仅 ADMIN 可调用）
// 用法: POST /api/admin/cleanup-data?secret=YOUR_SECRET
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== "cleanup-2026-04-20") {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    const results: Record<string, number> = {};

    // 1. 删除测试公司
    const testCompanies = ["测试公司1776522755", "测试企业1776522563", "测试科技有限公司"];
    const deletedCompanies = await prisma.companies.deleteMany({
      where: { name: { in: testCompanies } },
    });
    results.deletedCompanies = deletedCompanies.count;

    // 2. 删除关联到已删除公司的职位
    const deletedJobs = await prisma.jobs.deleteMany({
      where: {
        companies: { name: { in: testCompanies } },
      },
    });
    results.deletedJobs = deletedJobs.count;

    // 3. 更新所有职位的 datePosted 为 createdAt（如果 datePosted 是未来日期）
    const futureJobs = await prisma.jobs.findMany({
      where: {
        datePosted: { gt: new Date() },
      },
      select: { id: true, createdAt: true },
    });
    if (futureJobs.length > 0) {
      const updatePromises = futureJobs.map((j) =>
        prisma.jobs.update({
          where: { id: j.id },
          data: { datePosted: j.createdAt },
        })
      );
      await Promise.all(updatePromises);
    }
    results.updatedDatePosted = futureJobs.length;

    // 4. 更新职位详情中显示 2026/4/10 的（如果 createdAt 更早）
    const oldDateJobs = await prisma.jobs.findMany({
      where: {
        datePosted: { lte: new Date("2026-04-11") },
      },
      select: { id: true, createdAt: true },
    });
    if (oldDateJobs.length > 0) {
      const updatePromises = oldDateJobs.map((j) =>
        prisma.jobs.update({
          where: { id: j.id },
          data: { datePosted: j.createdAt },
        })
      );
      await Promise.all(updatePromises);
      results.normalizedDates = oldDateJobs.length;
    }

    // 5. 删除标题含"测试"或 slug 含明显测试特征的博客
    const testBlogs = await prisma.pages.findMany({
      where: {
        type: "BLOG",
        OR: [
          { title: { contains: "测试" } },
          { slug: { startsWith: "test-" } },
        ],
      },
      select: { id: true },
    });
    if (testBlogs.length > 0) {
      const deleted = await prisma.pages.deleteMany({
        where: { id: { in: testBlogs.map((b) => b.id) } },
      });
      results.deletedTestBlogs = deleted.count;
    }

    // 6. 清理 blog slug 中的纯随机 ID 后缀（如 -mnwhjzph）
    const badSlugBlogs = await prisma.pages.findMany({
      where: {
        type: "BLOG",
        slug: { endsWith: "-mnwhjzph" },
      },
      select: { id: true, slug: true },
    });
    results.cleanedBlogSlugs = badSlugBlogs.length;

    return NextResponse.json({
      success: true,
      message: "Data cleanup completed",
      results,
    });
  } catch (error: unknown) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
