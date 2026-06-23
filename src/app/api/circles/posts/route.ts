import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const CATEGORIES = ["PARTNER", "PROJECT", "SKILL", "OTHER"] as const;

const createSchema = z.object({
  content: z.string().trim().min(2).max(500),
  category: z.enum(CATEGORIES).default("OTHER"),
});

// GET /api/circles/posts?page=1&limit=20&category=PARTNER
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const categoryParam = searchParams.get("category");
    const category = categoryParam && (CATEGORIES as readonly string[]).includes(categoryParam)
      ? (categoryParam as (typeof CATEGORIES)[number])
      : undefined;

    const where = category ? { category } : {};

    const [items, total] = await Promise.all([
      prisma.circle_posts.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          users: { select: { id: true, name: true, avatar: true, email: true } },
        },
      }),
      prisma.circle_posts.count({ where }),
    ]);

    return NextResponse.json({
      posts: items.map((p) => ({
        id: p.id,
        content: p.content,
        category: p.category,
        commentCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
        author: {
          id: p.users.id,
          name: p.users.name,
          avatar: p.users.avatar,
          email: p.users.email,
        },
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error("List circle posts error:", error);
    return NextResponse.json({ error: "获取帖子列表失败" }, { status: 500 });
  }
}

// POST /api/circles/posts  — create a new post (requires login)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "内容长度需在 2-500 字之间，分类无效" },
        { status: 400 }
      );
    }

    // Simple anti-spam: max 5 posts in last hour per user
    const recentCount = await prisma.circle_posts.count({
      where: {
        authorId: session.user.id,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "发帖过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const post = await prisma.circle_posts.create({
      data: {
        authorId: session.user.id,
        content: parsed.data.content,
        category: parsed.data.category,
      },
      include: {
        users: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        category: post.category,
        commentCount: post.commentCount,
        createdAt: post.createdAt.toISOString(),
        author: {
          id: post.users.id,
          name: post.users.name,
          avatar: post.users.avatar,
          email: post.users.email,
        },
      },
    });
  } catch (error) {
    logger.error("Create circle post error:", error);
    return NextResponse.json({ error: "发帖失败" }, { status: 500 });
  }
}
