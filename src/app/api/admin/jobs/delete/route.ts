import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 删除职位
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const jobId = formData.get("jobId") as string;

    if (!jobId) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    // 验证职位存在
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    // 删除职位
    await prisma.job.delete({
      where: { id: jobId },
    });

    // 重新验证相关页面
    revalidatePath("/admin/jobs");
    revalidatePath("/jobs");

    return NextResponse.redirect(new URL("/admin/jobs", request.url));
  } catch (error) {
    console.error("删除职位失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
