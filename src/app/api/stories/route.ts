import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from '@/lib/logger';

// 前端类型与数据库类型的映射
export type StoryTypeUI = "ALL" | "TRANSFORMATION" | "INTERVIEW" | "INSIGHT" | "SKILL";

// 数据库中的StoryType
export type StoryTypeDB = "EXPERIENCE" | "TRANSITION" | "MILESTONE" | "CHALLENGE" | "INSIGHT";

// 类型映射：UI类型 -> DB类型
const typeMapping: Record<StoryTypeUI, StoryTypeDB[]> = {
  ALL: ["EXPERIENCE", "TRANSITION", "MILESTONE", "CHALLENGE", "INSIGHT"],
  TRANSFORMATION: ["TRANSITION"], // 职业转型
  INTERVIEW: ["EXPERIENCE"], // 经验分享（面试复盘）
  INSIGHT: ["INSIGHT"], // 行业洞察
  SKILL: ["CHALLENGE"], // 挑战与成长（技能进化）
};

// UI类型标签
const typeLabels: Record<StoryTypeUI, { label: string; color: string; bgColor: string }> = {
  ALL: { label: "全部", color: "text-gray-600", bgColor: "bg-gray-50" },
  TRANSFORMATION: { label: "转型日记", color: "text-purple-600", bgColor: "bg-purple-50" },
  INTERVIEW: { label: "面试复盘", color: "text-blue-600", bgColor: "bg-blue-50" },
  INSIGHT: { label: "职场顿悟", color: "text-amber-600", bgColor: "bg-amber-50" },
  SKILL: { label: "技能进化", color: "text-emerald-600", bgColor: "bg-emerald-50" },
};

// 根据DB类型获取UI类型
function getUIType(dbType: StoryTypeDB): StoryTypeUI {
  const mapping: Record<StoryTypeDB, StoryTypeUI> = {
    TRANSITION: "TRANSFORMATION",
    EXPERIENCE: "INTERVIEW",
    INSIGHT: "INSIGHT",
    CHALLENGE: "SKILL",
    MILESTONE: "INSIGHT",
  };
  return mapping[dbType];
}

function getStoryTypeLabel(type: StoryTypeUI) {
  return typeLabels[type] || { label: "其他", color: "text-gray-600", bgColor: "bg-gray-50" };
}

export interface Story {
  id: string;
  title: string;
  content: string;
  type: StoryTypeUI;
  users: {
    id: string;
    name: string;
    avatar: string | null;
  };
  resonanceCount: number;
  commentCount: number;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    logo: string | null;
    slug: string;
  } | null;
}

export const dynamic = "force-dynamic";

// GET /api/stories - 获取故事列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get("type") as StoryTypeUI) || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const companyId = searchParams.get("companyId");

    // 获取对应的数据库类型
    const dbTypes = typeMapping[typeParam];

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      type: { in: dbTypes },
    };

    // 如果指定了公司ID，添加过滤条件
    if (companyId) {
      where.companyId = companyId;
    }

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
      },
    });

    // 转换为前端格式
    const formattedStories: Story[] = stories.map((story) => ({
      id: story.id,
      title: story.title,
      content: story.content,
      type: getUIType(story.type),
      users: {
        id: story.users.id,
        name: story.users.name,
        avatar: story.users.avatar,
      },
      resonanceCount: story.resonanceCount,
      commentCount: 0,
      createdAt: story.createdAt.toISOString(),
      company: story.companies,
    }));

    return NextResponse.json({
      success: true,
      stories: formattedStories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("获取故事列表失败:", error);
    return NextResponse.json(
      { error: "获取故事列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/stories - 创建故事
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, type, timeline, companyId } = body;

    // 验证必填字段
    if (!title || title.trim().length < 5) {
      return NextResponse.json(
        { error: "标题至少需要5个字符" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: "内容至少需要100个字符" },
        { status: 400 }
      );
    }

    if (!type || !["EXPERIENCE", "TRANSITION", "MILESTONE", "CHALLENGE", "INSIGHT"].includes(type)) {
      return NextResponse.json(
        { error: "请选择有效的故事类型" },
        { status: 400 }
      );
    }

    // 如果指定了 companyId，验证公司是否存在
    if (companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json(
          { error: "指定的公司不存在" },
          { status: 400 }
        );
      }
    }

    // 创建故事
    const story = await prisma.career_stories.create({
      data: { id: crypto.randomUUID(), updatedAt: new Date(),
        title: title.trim(),
        content: content.trim(),
        type,
        timeline: timeline || null,
        authorId: session.user.id,
        companyId: companyId || null,
      },
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
      },
    });

    // 转换为前端格式
    const formattedStory: Story = {
      id: story.id,
      title: story.title,
      content: story.content,
      type: getUIType(story.type),
      users: {
        id: story.users.id,
        name: story.users.name,
        avatar: story.users.avatar,
      },
      resonanceCount: story.resonanceCount,
      commentCount: 0,
      createdAt: story.createdAt.toISOString(),
      company: story.companies,
    };

    return NextResponse.json({
      success: true,
      story: formattedStory,
    });
  } catch (error) {
    logger.error("创建故事失败:", error);
    return NextResponse.json(
      { error: "创建故事失败" },
      { status: 500 }
    );
  }
}
