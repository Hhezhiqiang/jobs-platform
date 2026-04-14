import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 获取企业职位列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // 获取用户关联的企业
    const membership = await prisma.company_members.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const companyId = membership?.companyId;

    const where: any = companyId ? { companyId } : {};
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobs.findMany({
      where,
      include: { companies: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { job_applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get company jobs error:", error);
    return NextResponse.json({ error: "获取职位列表失败" }, { status: 500 });
  }
}

// 创建职位
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户关联的企业
    const membership = await prisma.company_members.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!membership && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "请先注册企业" }, { status: 403 });
    }

    const companyId = membership?.companyId;

    // 检查企业是否已通过审核
    if (membership) {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: { verificationStatus: true },
      });
      if (company?.verificationStatus !== "APPROVED" && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "企业尚未通过审核，无法发布职位" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      requirements,
      benefits,
      employmentType,
      experience,
      salaryMin,
      salaryMax,
      location,
      city,
      isRemote,
      isHybrid,
      applyUrl,
    } = body;

    // 验证必填字段
    if (!title || !slug || !description) {
      return NextResponse.json(
        { error: "请填写职位名称、标识和描述" },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existingJob = await prisma.jobs.findUnique({
      where: { slug },
    });
    if (existingJob) {
      return NextResponse.json(
        { error: "该职位标识已被使用" },
        { status: 400 }
      );
    }

    const parsedSalaryMin = salaryMin ? parseInt(salaryMin, 10) : null;
    if (parsedSalaryMin !== null && isNaN(parsedSalaryMin)) {
      return NextResponse.json({ error: "无效参数" }, { status: 400 });
    }
    const parsedSalaryMax = salaryMax ? parseInt(salaryMax, 10) : null;
    if (parsedSalaryMax !== null && isNaN(parsedSalaryMax)) {
      return NextResponse.json({ error: "无效参数" }, { status: 400 });
    }

    const job = await prisma.jobs.create({
      data: {
        title,
        slug,
        description,
        requirements,
        benefits,
        employmentType: employmentType || "FULL_TIME",
        experience: experience || "MID",
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        location: location || "",
        city: city || location,
        isRemote: isRemote || false,
        isHybrid: isHybrid || false,
        applyUrl: applyUrl || "",
        companyId: companyId || body.companyId,
        authorId: session.user.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      { message: "职位发布成功", job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "发布职位失败" }, { status: 500 });
  }
}
