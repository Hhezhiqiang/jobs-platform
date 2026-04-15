import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stories/[id] - 获取故事详情
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const story = await prisma.careerStory.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            location: true,
            industry: true,
            size: true,
            website: true,
            _count: {
              select: {
                jobs: true,
              },
            },
          },
        },
        _count: {
          select: {
            resonances: true,
          },
        },
      },
    });
    
    if (!story) {
      return NextResponse.json(
        { error: "故事不存在" },
        { status: 404 }
      );
    }
    
    // 增加浏览量
    await prisma.careerStory.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    
    // 检查当前用户是否已共鸣
    let hasResonated = false;
    if (userId) {
      const resonance = await prisma.storyResonance.findUnique({
        where: {
          storyId_userId: {
            storyId: id,
            userId,
          },
        },
      });
      if (resonance) {
        hasResonated = true;
      }
    }

    // 检查用户是否有权限邀请（是公司成员）
    let canInvite = false;
    if (userId && story.companyId) {
      const membership = await prisma.company_members.findFirst({
        where: {
          companyId: story.companyId,
          userId: userId,
          role: { in: ["ADMIN", "RECRUITER"] },
        },
      });
      canInvite = !!membership;
    }
    
    return NextResponse.json({
      success: true,
      story: {
        ...story,
        viewCount: story.viewCount + 1,
      },
      hasResonated,
      canInvite,
    });
  } catch (error) {
    console.error("获取故事详情失败:", error);
    return NextResponse.json(
      { error: "获取故事详情失败" },
      { status: 500 }
    );
  }
}

// PATCH /api/stories/[id] - 更新故事
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    
    const story = await prisma.careerStory.findUnique({
      where: { id },
      select: { authorId: true },
    });
    
    if (!story) {
      return NextResponse.json(
        { error: "故事不存在" },
        { status: 404 }
      );
    }
    
    // 只有作者或管理员可以编辑
    if (story.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权编辑此故事" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { title, content, type, timeline, companyId } = body;
    
    // 如果修改了 companyId，验证公司是否存在
    if (companyId !== undefined) {
      if (companyId) {
        const company = await prisma.companies.findUnique({
          where: { id: companyId },
          select: { id: true },
        });
        if (!company) {
          return NextResponse.json(
            { error: "指定的公司不存在" },
            { status: 400 }
          );
        }
      }
    }

    const updatedStory = await prisma.careerStory.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(type && { type }),
        ...(timeline !== undefined && { timeline }),
        ...(companyId !== undefined && { companyId: companyId || null }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      story: updatedStory,
    });
  } catch (error) {
    console.error("更新故事失败:", error);
    return NextResponse.json(
      { error: "更新故事失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[id] - 删除故事
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    
    const story = await prisma.careerStory.findUnique({
      where: { id },
      select: { authorId: true },
    });
    
    if (!story) {
      return NextResponse.json(
        { error: "故事不存在" },
        { status: 404 }
      );
    }
    
    // 只有作者或管理员可以删除
    if (story.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权删除此故事" },
        { status: 403 }
      );
    }
    
    await prisma.careerStory.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: "故事已删除",
    });
  } catch (error) {
    console.error("删除故事失败:", error);
    return NextResponse.json(
      { error: "删除故事失败" },
      { status: 500 }
    );
  }
}
