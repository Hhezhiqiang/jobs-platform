import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/blog - 获取博客列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  try {
    const where: any = { type: "BLOG", status: "PUBLISHED" };

    // 分类筛选
    if (category && category !== "all") {
      const catToKeywords: Record<string, string[]> = {
        interview: ["面试", "interview"],
        resume: ["简历", "resume"],
        salary: ["薪资", "salary"],
        career: ["职业", "career"],
        trends: ["行业", "趋势"],
        skills: ["技能", "skills"],
      };
      const keywords = catToKeywords[category];
      if (keywords) {
        where.keywords = { hasSome: keywords };
      }
    }

    // 关键词筛选
    if (keyword) {
      where.keywords = { has: keyword };
    }

    const [posts, total] = await Promise.all([
      prisma.pages.findMany({
        where,
        include: { users: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pages.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Get blog posts error:", error);
    return NextResponse.json({ error: "获取博客列表失败" }, { status: 500 });
  }
}
