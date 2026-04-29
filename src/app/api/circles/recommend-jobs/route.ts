import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

// 验证 schema
const recommendSchema = z.object({
  seekerId: z.string(), // 求职者ID
  jobId: z.string(),      // 职位ID
  message: z.string().max(200).optional(), // 推荐留言
});

// POST: 向圈内求职者推荐职位
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    
    // 验证请求体
    const result = recommendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 }
      );
    }

    const { seekerId, jobId, message } = result.data;
    const recommenderId = session.user.id;

    // 不能推荐给自己
    if (seekerId === recommenderId) {
      return NextResponse.json(
        { error: "不能向自己推荐职位" },
        { status: 400 }
      );
    }

    // 检查求职者的求职状态
    const seekerStatus = await prisma.jobSeekingStatus.findUnique({
      where: { userId: seekerId },
    });

    if (!seekerStatus || seekerStatus.status === "CLOSED") {
      return NextResponse.json(
        { error: "该用户当前不在求职状态" },
        { status: 400 }
      );
    }

    // 检查权限（基于隐私设置）
    const canRecommend = await checkRecommendPermission(
      recommenderId,
      seekerId,
      seekerStatus.privacy
    );

    if (!canRecommend) {
      return NextResponse.json(
        { error: "没有权限向该用户推荐职位" },
        { status: 403 }
      );
    }

    // 检查职位是否存在且有效
    const job = await prisma.jobs.findUnique({
      where: { id: jobId, status: "ACTIVE" },
      include: { companies: { select: { name: true, logo: true } } },
    });

    if (!job) {
      return NextResponse.json(
        { error: "职位不存在或已下架" },
        { status: 404 }
      );
    }

    // 检查是否已经推荐过该职位给该用户
    const existingRecommendation = await prisma.jobRecommendation.findFirst({
      where: {
        senderId: recommenderId,
        receiverId: seekerId,
        jobId,
      },
    });

    if (existingRecommendation) {
      return NextResponse.json(
        { error: "已经向该用户推荐过这个职位" },
        { status: 409 }
      );
    }

    // 创建推荐记录
    const recommendation = await prisma.jobRecommendation.create({
      data: {
        senderId: recommenderId,
        receiverId: seekerId,
        jobId,
        message: message || null,
        status: "PENDING",
      },
    });

    // 更新求职者的推荐计数
    await prisma.jobSeekingStatus.update({
      where: { userId: seekerId },
      data: {
        recommendCount: { increment: 1 },
      },
    });

    // 发送通知给求职者
    try {
      await prisma.notifications.create({
        data: {
          userId: seekerId,
          type: "JOB_ALERT",
          title: "有新的职位推荐",
          content: `${session.user.name || "有人"} 向你推荐了「${job.title}」职位`,
          metadata: {
            recommendationId: recommendation.id,
            jobId,
            jobTitle: job.title,
            companyName: job.companies.name,
            senderId: recommenderId,
          },
        },
      });
    } catch (notifyError) {
      console.error("Send notification error:", notifyError);
      // 通知发送失败不影响推荐功能
    }

    return NextResponse.json({
      message: "职位推荐成功",
      recommendation: {
        id: recommendation.id,
        jobTitle: job.title,
        companyName: job.companies.name,
        status: recommendation.status,
        createdAt: recommendation.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Recommend job error:", error);
    return NextResponse.json({ error: "推荐职位失败" }, { status: 500 });
  }
}

// GET: 获取圈内正在求职的成员列表（用于推荐）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const circleId = searchParams.get("circleId"); // 可选：特定圈子
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    // 获取当前用户可见的正在求职的用户
    // 这里简化处理：返回所有公开的求职状态用户 + 当前用户关注的人 + 同圈子的人
    const jobSeekers = await prisma.jobSeekingStatus.findMany({
      where: {
        status: { in: ["OPEN", "PASSIVE"] },
        userId: { not: session.user.id }, // 排除自己
        // 隐私筛选
        OR: [
          { privacy: "PUBLIC" },
          { 
            privacy: "CIRCLES",
            // TODO: 需要实现圈子成员检查，这里简化处理
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { lastActiveAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      seekers: jobSeekers.map((seeker) => ({
        id: seeker.user.id,
        name: seeker.user.name,
        avatar: seeker.user.avatar,
        status: seeker.status,
        expectTags: seeker.expectTags,
        expectSalary: seeker.expectSalary,
        bio: seeker.bio,
        privacy: seeker.privacy,
        lastActiveAt: seeker.lastActiveAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get job seekers error:", error);
    return NextResponse.json({ error: "获取求职者列表失败" }, { status: 500 });
  }
}

// 检查推荐权限
async function checkRecommendPermission(
  recommenderId: string,
  seekerId: string,
  privacy: string
): Promise<boolean> {
  // PUBLIC: 任何人可以推荐
  if (privacy === "PUBLIC") return true;

  // PRIVATE: 只有自己可见，不允许推荐
  if (privacy === "PRIVATE") return false;

  // FOLLOWERS: 检查是否存在关注关系
  if (privacy === "FOLLOWERS") {
    // 检查是否有故事共鸣关系作为替代指标
    const resonance = await prisma.storyResonance.findFirst({
      where: {
        story: { authorId: seekerId },
        userId: recommenderId,
      },
    });
    // 有互动则允许推荐
    return !!resonance;
  }

  // CIRCLES: 检查是否在同个圈子（通过是否有共同互动记录判断）
  if (privacy === "CIRCLES") {
    // 检查是否有过共鸣或评论互动
    const hasInteraction = await prisma.storyResonance.findFirst({
      where: {
        OR: [
          { story: { authorId: seekerId }, userId: recommenderId },
          { story: { authorId: recommenderId }, userId: seekerId },
        ],
      },
    });
    if (hasInteraction) return true;

    // 检查是否有评论互动
    const hasComment = await prisma.storyComment.findFirst({
      where: {
        OR: [
          { story: { authorId: seekerId }, authorId: recommenderId },
          { story: { authorId: recommenderId }, authorId: seekerId },
        ],
      },
    });
    return !!hasComment;
  }

  return false;
}
