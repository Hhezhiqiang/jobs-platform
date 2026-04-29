export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { bindUserReferral, getPromoRef } from "@/lib/promoter";

// 简单 CAPTCHA 验证（可选，若提供则验证）
async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  if (!token) return true; // 未提供则跳过
  try {
    const secret = process.env.CAPTCHA_SECRET_KEY;
    if (!secret) return true; // 未配置密钥则跳过
    const res = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    // 注册：每分钟 5 次
    const rateLimitResult = checkRateLimit(ip, 5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password, phone, captcha } = body;

    // CAPTCHA 验证（如果提供了 token）
    const captchaValid = await verifyCaptcha(captcha);
    if (!captchaValid) {
      return NextResponse.json(
        { error: "验证码验证失败，请重试" },
        { status: 400 }
      );
    }

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: "密码至少8位，需包含字母和数字" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "USER",
        status: "ACTIVE",
      },
    });

    // 创建用户资料
    await prisma.user_profiles.create({
      data: {
        userId: user.id,
        skills: [],
      },
    });

    // CPS 推广归因绑定
    const promoRef = getPromoRef(request);
    if (promoRef) {
      await bindUserReferral(user.id, promoRef);
    }

    return NextResponse.json({
      success: true,
      message: "注册成功",
      users: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
