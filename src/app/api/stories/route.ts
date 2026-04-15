import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  resonanceCount: number;
  commentCount: number;
  createdAt: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get("type") as StoryTypeUI) || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);

    // 获取对应的数据库类型
    const dbTypes = typeMapping[typeParam];

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      type: { in: dbTypes },
    };

    // 获取总数
    const total = await prisma.careerStory.count({ where });

    // 获取故事列表
    const stories = await prisma.careerStory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
      author: {
        id: story.author.id,
        name: story.author.name,
        avatar: story.author.avatar,
      },
      resonanceCount: story.resonanceCount,
      commentCount: 0, // 暂时为0，因为没有comments关联
      createdAt: story.createdAt.toISOString(),
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
    console.error("获取故事列表失败:", error);
    return NextResponse.json(
      { error: "获取故事列表失败" },
      { status: 500 }
    );
  }
}
