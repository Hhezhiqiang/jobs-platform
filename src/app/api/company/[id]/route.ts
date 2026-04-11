import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 获取企业详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查是否是该企业成员
    const membership = await prisma.companyMember.findFirst({
      where: {
        companyId: id,
        userId: session.user.id,
      },
    });

    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "企业不存在" }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Get company error:", error);
    return NextResponse.json({ error: "获取企业信息失败" }, { status: 500 });
  }
}

// 更新企业信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查权限
    const membership = await prisma.companyMember.findFirst({
      where: {
        companyId: id,
        userId: session.user.id,
      },
    });

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "RECRUITER")) {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      name,
      description,
      website,
      industry,
      size,
      location,
      logo,
      contactPhone,
      contactEmail,
    } = body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        description,
        website,
        industry,
        size,
        location,
        logo,
        contactPhone,
        contactEmail,
      },
    });

    return NextResponse.json({ message: "更新成功", company });
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}