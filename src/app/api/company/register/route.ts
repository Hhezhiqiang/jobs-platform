import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 辅助函数：生成安全的 slug
function generateSlug(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 30) + '-' + Date.now().toString().slice(-4);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "请填写公司名称" }, { status: 400 });
    }

    // 生成 slug
    const slug = generateSlug(name);

    // 检查 slug 是否已存在
    const existingCompany = await prisma.companies.findUnique({ where: { slug } });
    if (existingCompany) {
      return NextResponse.json({ error: "该公司名称已被注册，请换一个" }, { status: 400 });
    }

    // 创建企业（直接通过，无需审核）
    const company = await prisma.companies.create({
      data: {
        name,
        slug,
        creditCode: "REG-" + Date.now(),
        description: "",
        industry: body.industry || "",
        size: body.size || "",
        location: body.location || "",
        verificationStatus: "APPROVED", // 注册即通过，无需审核
      },
    });

    // 创建关联成员
    await prisma.company_members.create({
      data: {
        companyId: company.id,
        userId: session.user.id,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error: any) {
    console.error("Company register error:", error);
    return NextResponse.json({ error: error.message || "注册失败，请稍后重试" }, { status: 500 });
  }
}
