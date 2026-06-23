import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// DELETE /api/circles/posts/:id  — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { id } = await params;

    const post = await prisma.circle_posts.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (post.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }

    await prisma.circle_posts.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Delete circle post error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
