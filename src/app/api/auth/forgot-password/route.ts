import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      // 安全考虑：不暴露用户是否存在
      return NextResponse.json({ message: "如果邮箱已注册，重置邮件已发送" });
    }

    // 生成重置令牌
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1小时过期

    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    // TODO: 发送邮件（需要配置邮件服务）
    // 暂时只返回成功，实际应该发送邮件包含重置链接
    console.log(`密码重置令牌: ${token} (用户: ${email})`);

    return NextResponse.json({ message: "如果邮箱已注册，重置邮件已发送" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
