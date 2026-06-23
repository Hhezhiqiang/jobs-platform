import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().trim().min(1).max(300),
});

// GET /api/circles/posts/:id/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.circle_post_comments.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        users: { select: { id: true, name: true, avatar: true } },
      },
    });
    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.users.id,
          name: c.users.name,
          avatar: c.users.avatar,
        },
      })),
    });
  } catch (error) {
    logger.error("List comments error:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

// POST /api/circles/posts/:id/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { id: postId } = await params;
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "评论内容需在 1-300 字之间" },
        { status: 400 }
      );
    }

    const post = await prisma.circle_posts.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.circle_post_comments.create({
        data: {
          postId,
          authorId: session.user.id,
          content: parsed.data.content,
        },
        include: { users: { select: { id: true, name: true, avatar: true } } },
      });
      await tx.circle_posts.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return c;
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.users.id,
          name: comment.users.name,
          avatar: comment.users.avatar,
        },
      },
    });
  } catch (error) {
    logger.error("Create comment error:", error);
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }
}
