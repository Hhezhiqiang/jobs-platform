import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";

// 更新用户详细资料（工作经历、教育背景、技能等）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      gender,
      birthday,
      location,
      bio,
      skills,
      workExperience,
      education,
    } = body;

    // 查找或创建用户资料
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        gender: gender || null,
        birthday: birthday ? new Date(birthday) : null,
        location: location || null,
        bio: bio || null,
        skills: skills || [],
        workExperience: workExperience || [],
        education: education || [],
      },
      update: {
        ...(gender !== undefined && { gender }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(workExperience !== undefined && { workExperience }),
        ...(education !== undefined && { education }),
      },
    });

    return NextResponse.json({
      message: "资料更新成功",
      profile,
    });
  } catch (error) {
    console.error("Update detailed profile error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 修改密码
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "请提供当前密码和新密码" },
        { status: 400 }
      );
    }

    // 验证新密码强度
    if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        { error: "新密码至少8位，需包含字母和数字" },
        { status: 400 }
      );
    }

    // 获取用户信息（包含密码）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "当前密码不正确" },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
  }
}