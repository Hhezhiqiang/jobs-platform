import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

/**
 * GET /api/companies/[id]/culture-tags
 * 获取公司文化标签（共识标签）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: companyId } = params;

    // 验证公司存在
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    // 获取文化标签（按投票数排序）
    const tags = await prisma.companyCultureTag.findMany({
      where: { companyId },
      orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      companyId,
      tags: tags.map((tag) => ({
        id: tag.id,
        tagName: tag.tagName,
        voteCount: tag.voteCount,
      })),
    });
  } catch (error) {
    logger.error("获取公司文化标签失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/companies/[id]/culture-tags
 * 添加/投票公司文化标签
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: companyId } = params;
    const body = await request.json();
    const { tagName, action = "vote" } = body; // action: "vote" | "remove"

    if (!tagName || typeof tagName !== "string") {
      return NextResponse.json({ error: "请提供标签名称" }, { status: 400 });
    }

    // 标准化标签名
    const normalizedTagName = tagName.trim();
    if (normalizedTagName.length < 2 || normalizedTagName.length > 20) {
      return NextResponse.json(
        { error: "标签名称长度应在2-20个字符之间" },
        { status: 400 }
      );
    }

    // 验证公司存在
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    // 检查用户是否是公司成员
    const isMember = await prisma.company_members.findFirst({
      where: {
        companyId,
        userId: session.user.id,
      },
    });

    // 暂时允许所有登录用户投票，未来可以限制为公司成员或已验证用户
    // if (!isMember && session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "只有公司成员可以添加标签" },
    //     { status: 403 }
    //   );
    // }

    if (action === "remove") {
      // 删除标签（仅允许公司管理员或添加者删除）
      // 简化版本：任何人都可以删除（实际应添加权限控制）
      const existingTag = await prisma.companyCultureTag.findFirst({
        where: {
          companyId,
          tagName: {
            equals: normalizedTagName,
            mode: "insensitive",
          },
        },
      });

      if (!existingTag) {
        return NextResponse.json({ error: "标签不存在" }, { status: 404 });
      }

      // 如果投票数大于1，减少票数；否则删除
      if (existingTag.voteCount > 1) {
        const updated = await prisma.companyCultureTag.update({
          where: { id: existingTag.id },
          data: { voteCount: { decrement: 1 } },
        });
        return NextResponse.json({
          message: "已减少标签认同",
          tag: {
            id: updated.id,
            tagName: updated.tagName,
            voteCount: updated.voteCount,
          },
        });
      } else {
        await prisma.companyCultureTag.delete({
          where: { id: existingTag.id },
        });
        return NextResponse.json({
          message: "标签已删除",
          tag: {
            tagName: normalizedTagName,
            voteCount: 0,
          },
        });
      }
    }

    // 添加/投票标签
    const existingTag = await prisma.companyCultureTag.findFirst({
      where: {
        companyId,
        tagName: {
          equals: normalizedTagName,
          mode: "insensitive",
        },
      },
    });

    if (existingTag) {
      // 标签已存在，增加投票数
      const updated = await prisma.companyCultureTag.update({
        where: { id: existingTag.id },
        data: { voteCount: { increment: 1 } },
      });
      return NextResponse.json({
        message: "已认同该标签",
        tag: {
          id: updated.id,
          tagName: updated.tagName,
          voteCount: updated.voteCount,
        },
      });
    } else {
      // 创建新标签
      const newTag = await prisma.companyCultureTag.create({
        data: {
          companyId,
          tagName: normalizedTagName,
          voteCount: 1,
        },
      });
      return NextResponse.json(
        {
          message: "标签已添加",
          tag: {
            id: newTag.id,
            tagName: newTag.tagName,
            voteCount: newTag.voteCount,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    logger.error("添加文化标签失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/companies/[id]/culture-tags
 * 删除公司文化标签（管理员权限）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: companyId } = params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "请提供标签ID" }, { status: 400 });
    }

    // 检查用户是否是公司管理员
    const isAdmin = await prisma.company_members.findFirst({
      where: {
        companyId,
        userId: session.user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    // 删除标签
    await prisma.companyCultureTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: "标签已删除" });
  } catch (error) {
    logger.error("删除文化标签失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
