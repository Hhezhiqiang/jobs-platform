import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 获取职位列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const membership = await prisma.company_members.findFirst({ where: { userId: session.user.id } });
    if (!membership && session.user.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const companyId = membership?.companyId;
    const where: any = companyId ? { companyId } : {};
    if (status) where.status = status;

    const jobs = await prisma.jobs.findMany({
      where,
      include: { companies: { select: { id: true, name: true } }, _count: { select: { job_applications: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "获取职位失败" }, { status: 500 });
  }
}

// 创建职位
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const membership = await prisma.company_members.findFirst({ where: { userId: session.user.id } });
    if (!membership && session.user.role !== "ADMIN") return NextResponse.json({ error: "请先注册企业" }, { status: 403 });

    const body = await request.json();
    const companyId = membership?.companyId || body.companyId;
    if (!companyId) return NextResponse.json({ error: "无法确定所属企业" }, { status: 400 });

    // 自动生成 slug
    const slug = body.slug || `${body.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}-${Date.now()}`;

    const job = await prisma.jobs.create({
      data: {
        title: body.title,
        slug,
        description: body.description || "",
        requirements: body.requirements || "",
        benefits: body.benefits || "",
        employmentType: body.employmentType || "FULL_TIME",
        experience: body.experience || null,
        salaryMin: body.salaryMin ? parseInt(body.salaryMin, 10) : null,
        salaryMax: body.salaryMax ? parseInt(body.salaryMax, 10) : null,
        location: body.location || null,
        city: body.city || null,
        isRemote: body.isRemote || false,
        isHybrid: body.isHybrid || false,
        applyUrl: body.applyUrl || null,
        companyId,
        authorId: session.user.id,
        status: body.status || "ACTIVE",
        datePosted: new Date(),
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: error.message || "发布失败" }, { status: 500 });
  }
}
