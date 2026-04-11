import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 切换职位状态（上架/下架）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const formData = await request.formData();
    const jobId = formData.get("jobId") as string;

    if (!jobId) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    // 获取当前职位
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    // 切换状态：ACTIVE -> INACTIVE，其他 -> ACTIVE
    const newStatus = job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    // 重新验证相关页面
    revalidatePath("/admin/jobs");
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${job.slug}`);

    return NextResponse.redirect(new URL("/admin/jobs", request.url));
  } catch (error) {
    console.error("切换职位状态失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
