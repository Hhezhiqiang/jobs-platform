import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 验证用户
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户的所有简历
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      take: 50,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("获取简历列表失败:", error);
    return NextResponse.json({ error: "获取失败，请稍后重试" }, { status: 500 });
  }
}
