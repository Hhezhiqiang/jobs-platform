export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTrc20Address } from "@/lib/promoter";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, email, phone, walletAddress } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "请填写姓名和邮箱" }, { status: 400 });
    }

    if (walletAddress && !isValidTrc20Address(walletAddress)) {
      return NextResponse.json({ error: "请输入有效的 TRC-20 地址" }, { status: 400 });
    }

    const existing = await prisma.promoter.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已申请" }, { status: 400 });
    }

    const data: any = {
      name,
      email,
      phone,
      walletAddress,
      status: "PENDING",
    };

    // 如果当前用户已登录主站，自动绑定 userId
    if (session?.user?.id) {
      data.userId = session.user.id;
    }

    const promoter = await prisma.promoter.create({ data });

    return NextResponse.json({
      success: true,
      promoterId: promoter.id,
      defaultRate: promoter.defaultRate,
    });
  } catch (error) {
    console.error("Promoter apply error:", error);
    return NextResponse.json({ error: "申请失败" }, { status: 500 });
  }
}
