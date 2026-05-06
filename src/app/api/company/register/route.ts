import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logger } from '@/lib/logger';
export const dynamic = "force-dynamic";

function generateSlug(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 30) + '-' + Date.now().toString().slice(-6);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, email, password, industry, size, location } = body;

    if (!name) {
      return NextResponse.json({ error: "请填写公司名称" }, { status: 400 });
    }

    // 场景1：已登录用户直接创建企业
    if (session?.user?.id) {
      const slug = generateSlug(name);
      const existingCompany = await prisma.companies.findUnique({ where: { slug } });
      if (existingCompany) {
        return NextResponse.json({ error: "该公司名称已被注册，请换一个" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.companies.create({
          data: {
            name, slug,
            creditCode: "REG-" + Date.now(),
            description: "",
            industry: industry || "",
            size: size || "",
            location: location || "",
            verificationStatus: "APPROVED",
          },
        });
        await tx.company_members.create({
          data: { companyId: company.id, userId: session.user.id, role: "ADMIN" },
        });
        return company;
      });

      return NextResponse.json({ success: true, companyId: result.id });
    }

    // 场景2：未登录 → 自动创建用户 + 企业（一步注册）
    if (!email || !password) {
      return NextResponse.json({ error: "请提供邮箱和密码以创建企业账户" }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已注册，请先登录" }, { status: 400 });
    }

    // 创建用户、企业、关系 - 使用事务
    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = generateSlug(name);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          name: name,
          password: hashedPassword,
          role: "COMPANY",
        },
      });
      const company = await tx.companies.create({
        data: {
          name, slug,
          creditCode: "REG-" + Date.now(),
          description: "",
          industry: industry || "",
          size: size || "",
          location: location || "",
          verificationStatus: "APPROVED",
        },
      });
      await tx.company_members.create({
        data: { companyId: company.id, userId: user.id, role: "ADMIN" },
      });
      return { user, company };
    });

    return NextResponse.json({
      success: true,
      companyId: result.company.id,
      userId: result.user.id,
      autoLogin: true,
    });
  } catch (error: any) {
    logger.error("Company register error:", error);
    return NextResponse.json({ error: error.message || "注册失败，请稍后重试" }, { status: 500 });
  }
}
