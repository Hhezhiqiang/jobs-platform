import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';
export const dynamic = "force-dynamic";

// 获取单个公司
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const company = await prisma.companies.findUnique({
      where: { id },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    logger.error("Get company error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 更新公司
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 权限校验：仅 ADMIN 或该公司 ADMIN 成员可操作
    if (session.user.role !== "ADMIN") {
      const membership = await prisma.company_members.findFirst({
        where: { companyId: id, userId: session.user.id, role: "ADMIN" },
      });
      if (!membership) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }
    }

    const body = await request.json();

    // 检查公司是否存在
    const existingCompany = await prisma.companies.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    // 如果更改了 slug，检查新 slug 是否已存在
    if (body.slug && body.slug !== existingCompany.slug) {
      const slugExists = await prisma.companies.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "该URL标识已被使用" },
          { status: 400 }
        );
      }
    }

    const company = await prisma.companies.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        website: body.website || null,
        industry: body.industry || null,
        size: body.size || null,
        location: body.location || null,
        logo: body.logo || null,
        description: body.description || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    logger.error("Update company error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除公司
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 权限校验：仅 ADMIN 或该公司 ADMIN 成员可操作
    if (session.user.role !== "ADMIN") {
      const membership = await prisma.company_members.findFirst({
        where: { companyId: id, userId: session.user.id, role: "ADMIN" },
      });
      if (!membership) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }
    }

    // 检查公司是否存在
    const company = await prisma.companies.findUnique({
      where: { id },
      include: { jobs: true },
    });

    if (!company) {
      return NextResponse.json({ error: "公司不存在" }, { status: 404 });
    }

    // 删除公司（关联的职位会被级联删除）
    await prisma.companies.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    logger.error("Delete company error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}