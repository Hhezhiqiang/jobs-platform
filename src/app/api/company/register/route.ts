import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 企业注册申请
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      website,
      industry,
      size,
      location,
      creditCode,
      legalPersonName,
      contactPhone,
      contactEmail,
      businessLicense,
    } = body;

    // 验证必填字段
    if (!name || !slug || !creditCode) {
      return NextResponse.json(
        { error: "请填写公司名称、企业标识和统一社会信用代码" },
        { status: 400 }
      );
    }

    // 验证 slug 格式
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "企业标识只能包含小写字母、数字和连字符" },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existingCompany = await prisma.companies.findUnique({
      where: { slug },
    });
    if (existingCompany) {
      return NextResponse.json(
        { error: "该企业标识已被使用" },
        { status: 400 }
      );
    }

    // 检查统一社会信用代码是否已存在
    const existingCreditCode = await prisma.companies.findUnique({
      where: { creditCode },
    });
    if (existingCreditCode) {
      return NextResponse.json(
        { error: "该统一社会信用代码已被注册" },
        { status: 400 }
      );
    }

    // 创建企业
    const company = await prisma.companies.create({
      data: {
        name,
        slug,
        description,
        website,
        industry,
        size,
        location,
        creditCode,
        legalPersonName,
        contactPhone,
        contactEmail,
        businessLicense,
        verificationStatus: "PENDING",
      },
    });

    // 将当前用户添加为企业管理员
    await prisma.company_members.create({
      data: {
        companyId: company.id,
        userId: session.user.id,
        role: "ADMIN",
      },
    });

    // 更新用户角色为 COMPANY
    await prisma.users.update({
      where: { id: session.user.id },
      data: { role: "COMPANY" },
    });

    return NextResponse.json(
      { message: "企业注册申请已提交，等待审核", company },
      { status: 201 }
    );
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}

// 获取当前用户的企业列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const companies = await prisma.companies.findMany({
      where: {
        company_members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: { company_members: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json({ error: "获取企业列表失败" }, { status: 500 });
  }
}