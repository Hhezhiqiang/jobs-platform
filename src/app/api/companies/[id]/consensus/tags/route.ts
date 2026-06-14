import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: 添加新标签
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
    const { tagName } = body;

    if (!tagName || typeof tagName !== "string" || tagName.trim().length === 0) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    // 检查标签是否已存在
    const existingTag = await prisma.company_culture_tags.findFirst({
      where: { companyId, tagName: tagName.trim() },
    });

    if (existingTag) {
      return NextResponse.json({ error: "标签已存在" }, { status: 409 });
    }

    // 创建新标签
    const newTag = await prisma.company_culture_tags.create({
      data: { id: crypto.randomUUID(), updatedAt: new Date(),
        companyId,
        tagName: tagName.trim(),
        voteCount: 1,
      },
    });

    return NextResponse.json({
      success: true,
      tag: newTag,
    });
  } catch (error) {
    logger.error("Add consensus tag error:", error);
    return NextResponse.json(
      { error: "添加标签失败" },
      { status: 500 }
    );
  }
}
