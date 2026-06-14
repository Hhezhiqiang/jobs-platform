import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 获取公司共识标签列表
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: companyId } = await context.params;

    const tags = await prisma.company_culture_tags.findMany({
      where: { companyId },
      orderBy: [
        { voteCount: "desc" },
      ],
    });

    // 处理返回数据
    const processedTags = tags.map((tag) => ({
      id: tag.id,
      tagName: tag.tagName,
      voteCount: tag.voteCount,
    }));

    return NextResponse.json({ tags: processedTags });
  } catch (error) {
    logger.error("Get consensus tags error:", error);
    return NextResponse.json(
      { error: "获取标签列表失败" },
      { status: 500 }
    );
  }
}
