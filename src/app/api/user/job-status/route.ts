import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

// 求职状态枚举
const JobSeekingStatusEnum = z.enum(["OPEN", "PASSIVE", "CLOSED"]);
const JobSeekingPrivacy = z.enum(["PUBLIC", "FOLLOWERS", "CIRCLES", "PRIVATE"]);

// 验证 schema
const updateSchema = z.object({
  status: JobSeekingStatusEnum,
  expectTags: z.array(z.string()).max(10).optional(),
  expectSalary: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  privacy: JobSeekingPrivacy.optional(),
});

// GET: 获取当前求职状态
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const jobStatus = await prisma.jobSeekingStatus.findUnique({
      where: { userId: session.user.id },
    });

    // 如果没有记录，返回默认状态
    if (!jobStatus) {
      return NextResponse.json({
        status: "CLOSED",
        expectTags: [],
        expectSalary: null,
        bio: null,
        privacy: "CIRCLES",
        viewCount: 0,
        recommendCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: jobStatus.status,
      expectTags: jobStatus.expectTags,
      expectSalary: jobStatus.expectSalary,
      bio: jobStatus.bio,
      privacy: jobStatus.privacy,
      viewCount: jobStatus.viewCount,
      recommendCount: jobStatus.recommendCount,
      createdAt: jobStatus.createdAt.toISOString(),
      updatedAt: jobStatus.updatedAt.toISOString(),
      lastActiveAt: jobStatus.lastActiveAt.toISOString(),
    });
  } catch (error) {
    console.error("Get job status error:", error);
    return NextResponse.json({ error: "获取求职状态失败" }, { status: 500 });
  }
}

// POST: 更新求职状态
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    
    // 验证请求体
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 }
      );
    }

    const { status, expectTags, expectSalary, bio, privacy } = result.data;

    // 如果状态是 CLOSED，自动将 privacy 设为 PRIVATE
    const finalPrivacy = status === "CLOSED" ? "PRIVATE" : (privacy || "CIRCLES");

    // 使用 upsert 创建或更新
    const updatedStatus = await prisma.jobSeekingStatus.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        status,
        expectTags: expectTags || [],
        expectSalary: expectSalary || null,
        bio: bio || null,
        privacy: finalPrivacy,
        lastActiveAt: new Date(),
      },
      update: {
        status,
        ...(expectTags !== undefined && { expectTags }),
        ...(expectSalary !== undefined && { expectSalary }),
        ...(bio !== undefined && { bio }),
        privacy: finalPrivacy,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "求职状态更新成功",
      jobStatus: {
        status: updatedStatus.status,
        expectTags: updatedStatus.expectTags,
        expectSalary: updatedStatus.expectSalary,
        bio: updatedStatus.bio,
        privacy: updatedStatus.privacy,
        viewCount: updatedStatus.viewCount,
        recommendCount: updatedStatus.recommendCount,
        createdAt: updatedStatus.createdAt.toISOString(),
        updatedAt: updatedStatus.updatedAt.toISOString(),
        lastActiveAt: updatedStatus.lastActiveAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update job status error:", error);
    return NextResponse.json({ error: "更新求职状态失败" }, { status: 500 });
  }
}
