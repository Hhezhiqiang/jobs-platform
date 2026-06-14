import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

// GET /api/companies/[id]/stories - 获取@该公司的故事列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 验证公司是否存在
    const company = await prisma.companies.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        slug: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "公司不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否是公司成员且有权限
    let canManage = false;
    if (userId) {
      const membership = await prisma.company_members.findFirst({
        where: {
          companyId: id,
          userId: userId,
          role: { in: ["ADMIN", "RECRUITER"] },
        },
      });
      if (membership || session?.user?.role === "ADMIN") {
        canManage = true;
      }
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = (page - 1) * limit;

    // 构建查询条件 - 只查询关联了该公司的故事
    const where = {
      companyId: id,
    };

    // 获取总数
    const total = await prisma.career_stories.count({ where });

    // 获取故事列表
    const stories = await prisma.career_stories.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
        _count: {
          select: {
            story_resonances: true,
          },
        },
      },
    });

    // 格式化响应
    const formattedStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      content: story.content,
      type: story.type,
      viewCount: story.viewCount,
      resonanceCount: story.resonanceCount,
      createdAt: story.createdAt.toISOString(),
      author: story.users,
      company: story.companies,
      resonanceTotal: story._count.story_resonances,
    }));

    return NextResponse.json({
      success: true,
      company,
      stories: formattedStories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        canManage,
      },
    });
  } catch (error) {
    logger.error("Get company stories error:", error);
    return NextResponse.json(
      { error: "获取故事列表失败" },
      { status: 500 }
    );
  }
}
