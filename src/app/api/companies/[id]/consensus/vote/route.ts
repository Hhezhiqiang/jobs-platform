import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: 对标签投票（简化版：只增加voteCount）
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: companyId } = await context.params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: "缺少标签ID" }, { status: 400 });
    }

    // 查找标签
    const tag = await prisma.company_culture_tags.findFirst({
      where: { id: tagId, companyId },
    });

    if (!tag) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 });
    }

    // 增加voteCount
    const updatedTag = await prisma.company_culture_tags.update({
      where: { id: tagId },
      data: { voteCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      tag: updatedTag,
    });
  } catch (error) {
    logger.error("Vote error:", error);
    return NextResponse.json(
      { error: "投票失败" },
      { status: 500 }
    );
  }
}
