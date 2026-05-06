import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// GET: 获取故事评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: storyId } = params;

    // 检查故事是否存在
    const story = await prisma.careerStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: "故事不存在" }, { status: 404 });
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const skip = (page - 1) * pageSize;

    // 使用Prisma Client查询评论（需要schema中有StoryComment模型）
    // 如果模型不存在，这里会返回空数组
    let comments: CommentWithAuthor[] = [];
    let total = 0;

    try {
      comments = await prisma.storyComment.findMany({
        where: { storyId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      });

      total = await prisma.storyComment.count({
        where: { storyId },
      });
    } catch {
      // StoryComment模型不存在，返回空数组
      comments = [];
      total = 0;
    }

    return NextResponse.json({
      comments,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    logger.error("[Comments GET Error]", error);
    return NextResponse.json({ error: "获取评论列表失败" }, { status: 500 });
  }
}

// POST: 发表评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 验证用户登录
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: storyId } = params;
    const userId = session.user.id;

    // 检查故事是否存在
    const story = await prisma.careerStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: "故事不存在" }, { status: 404 });
    }

    // 解析请求体
    const body = await request.json();
    const { content } = body;

    // 验证评论内容
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: "评论内容不能超过1000字" }, { status: 400 });
    }

    // 创建评论
    let comment: CommentWithAuthor;

    try {
      comment = await prisma.storyComment.create({
        data: {
          storyId,
          authorId: userId,
          content: content.trim(),
        },
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
    } catch {
      // StoryComment模型不存在
      return NextResponse.json(
        { error: "评论功能暂不可用，请联系管理员" },
        { status: 503 }
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logger.error("[Comments POST Error]", error);
    return NextResponse.json({ error: "发表评论失败" }, { status: 500 });
  }
}

// 评论类型定义
interface CommentWithAuthor {
  id: string;
  storyId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}
