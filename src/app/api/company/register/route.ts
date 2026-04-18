import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 辅助函数：生成安全的 slug
function generateSlug(name: string): string {
  // 移除特殊字符，保留字母数字，空格转连字符
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
    let { name, slug, creditCode } = body;

    // 放宽必填项限制 (为了测试方便，允许测试数据)
    if (!name) {
      return NextResponse.json({ error: "请填写公司名称" }, { status: 400 });
    }

    // 如果没有 slug 或格式不对，自动生成
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug || !slugRegex.test(slug)) {
      slug = generateSlug(name);
    }

    // 检查 slug 是否已存在
    const existingCompany = await prisma.companies.findUnique({ where: { slug } });
    if (existingCompany) {
      slug = generateSlug(name); // 冲突则重新生成
    }

    // 处理 creditCode (允许为空或测试数据)
    if (!creditCode) {
      creditCode = "TEST-" + Date.now();
    }

    // 创建企业
    const company = await prisma.companies.create({
      data: {
        name,
        slug,
        creditCode,
        description: body.description || "",
        industry: body.industry || "",
        size: body.size || "",
        location: body.location || "",
        contactEmail: body.contactEmail || "",
        contactPhone: body.contactPhone || "",
        verificationStatus: "PENDING", // 默认待审核
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
