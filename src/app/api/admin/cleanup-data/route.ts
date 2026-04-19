import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLEANUP_SECRET = "cleanup-2026-04-20";

// 一次性数据清理 API
// 用法: POST /api/admin/cleanup-data?secret=cleanup-2026-04-20
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== CLEANUP_SECRET) {
      return NextResponse.json({ error: "Invalid or missing secret" }, { status: 403 });
    }

    const results: Record<string, number> = {};

    // 1. 删除测试公司
    const deletedCompanies = await prisma.companies.deleteMany({
      where: {
        name: {
          in: ["测试公司1776522755", "测试企业1776522563", "测试科技有限公司"],
        },
      },
    });
    results.deletedCompanies = deletedCompanies.count;

    // 2. 删除 "未知公司"
    const deletedUnknown = await prisma.companies.deleteMany({
      where: { name: "未知公司" },
    });
    results.deletedUnknownCompany = deletedUnknown.count;

    // 3. 将 datePosted 为 2026-04-10 的职位更新为 createdAt
    const targetDate = new Date("2026-04-10T00:00:00.000Z");
    const endDate = new Date("2026-04-10T23:59:59.999Z");
    const jobsToUpdate = await prisma.jobs.findMany({
      where: {
        datePosted: { gte: targetDate, lte: endDate },
      },
      select: { id: true, createdAt: true },
    });
    if (jobsToUpdate.length > 0) {
      const updates = jobsToUpdate.map((j) =>
        prisma.jobs.update({
          where: { id: j.id },
          data: { datePosted: j.createdAt },
        })
      );
      await Promise.all(updates);
    }
    results.updatedDatePosted = jobsToUpdate.length;

    // 4. 将任何 datePosted 为未来日期的职位也更新
    const futureJobs = await prisma.jobs.findMany({
      where: { datePosted: { gt: new Date() } },
      select: { id: true, createdAt: true },
    });
    if (futureJobs.length > 0) {
      const updates = futureJobs.map((j) =>
        prisma.jobs.update({
          where: { id: j.id },
          data: { datePosted: j.createdAt },
        })
      );
      await Promise.all(updates);
    }
    results.updatedFutureDates = futureJobs.length;

    // 5. 删除标题含"测试"的博客
    const deletedTestBlogs = await prisma.pages.deleteMany({
      where: {
        type: "BLOG",
        title: { contains: "测试" },
      },
    });
    results.deletedTestBlogs = deletedTestBlogs.count;

    // 6. 删除 slug 以 "-mnwhjzph" 结尾的博客
    const deletedBadSlugs = await prisma.pages.deleteMany({
      where: {
        type: "BLOG",
        slug: { endsWith: "-mnwhjzph" },
      },
    });
    results.deletedBadSlugs = deletedBadSlugs.count;

    return NextResponse.json({
      success: true,
      message: "Data cleanup completed",
      results,
    });
  } catch (error: unknown) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
