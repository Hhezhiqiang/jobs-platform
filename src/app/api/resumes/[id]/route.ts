import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// 获取单个简历
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("获取简历失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 删除简历
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    // 查找简历
    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    // 删除文件
    try {
      const filePath = join(process.cwd(), "public", resume.fileUrl);
      await unlink(filePath);
    } catch (err) {
      console.error("删除文件失败:", err);
      // 继续删除数据库记录，即使文件删除失败
    }

    // 删除数据库记录
    await prisma.resume.delete({
      where: { id },
    });

    // 如果删除的是默认简历，将最新的简历设为默认
    if (resume.isDefault) {
      const latestResume = await prisma.resume.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      
      if (latestResume) {
        await prisma.resume.update({
          where: { id: latestResume.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除简历失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

// 更新简历（设置默认）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // 查找简历
    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    // 如果设置为默认，先将其他简历设为非默认
    if (body.isDefault) {
      await prisma.resume.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // 更新简历
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        isDefault: body.isDefault,
        name: body.name,
      },
    });

    return NextResponse.json({ success: true, resume: updatedResume });
  } catch (error) {
    console.error("更新简历失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
