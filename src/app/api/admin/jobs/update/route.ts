import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EmploymentType, ExperienceLevel, JobStatus } from "@prisma/client";
export const dynamic = "force-dynamic";

// 更新职位
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

    // 验证职位存在
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    // 提取表单数据
    const title = formData.get("title") as string;
    const companyId = formData.get("companyId") as string;
    const employmentType = formData.get("employmentType") as EmploymentType;
    const experience = formData.get("experience") as ExperienceLevel;
    const city = formData.get("city") as string;
    const location = formData.get("location") as string;
    const applyUrl = formData.get("applyUrl") as string;
    const salaryMin = formData.get("salaryMin") as string;
    const salaryMax = formData.get("salaryMax") as string;
    const salaryCurrency = formData.get("salaryCurrency") as string;
    const isRemote = formData.get("isRemote") === "on";
    const isHybrid = formData.get("isHybrid") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const description = formData.get("description") as string;
    const requirements = formData.get("requirements") as string;
    const benefits = formData.get("benefits") as string;
    const status = formData.get("status") as JobStatus;

    // 更新职位
    await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        companyId,
        employmentType,
        experience,
        city,
        location,
        applyUrl,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency,
        isRemote,
        isHybrid,
        isFeatured,
        description,
        requirements,
        benefits,
        status,
      },
    });

    // 重新验证相关页面
    revalidatePath("/admin/jobs");
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${existingJob.slug}`);

    return NextResponse.redirect(new URL("/admin/jobs", request.url));
  } catch (error) {
    console.error("更新职位失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
