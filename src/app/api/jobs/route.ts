import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 静态职位数据
const staticJobs = [
  {
    id: "1",
    slug: "senior-frontend-engineer",
    title: "高级前端工程师",
    description: "负责公司核心产品的前端开发工作...",
    employmentType: "FULL_TIME",
    salaryMin: 25000,
    salaryMax: 40000,
    salaryCurrency: "CNY",
    location: "北京市朝阳区",
    city: "北京",
    status: "ACTIVE",
    datePosted: new Date().toISOString(),
    company: {
      id: "1",
      name: "科技有限公司",
      slug: "tech-corp",
      logo: null,
    },
  },
  {
    id: "2",
    slug: "backend-engineer",
    title: "后端开发工程师",
    description: "负责服务端架构设计和开发...",
    employmentType: "FULL_TIME",
    salaryMin: 20000,
    salaryMax: 35000,
    salaryCurrency: "CNY",
    location: "上海市浦东新区",
    city: "上海",
    status: "ACTIVE",
    datePosted: new Date().toISOString(),
    company: {
      id: "2",
      name: "创新科技",
      slug: "innovation-tech",
      logo: null,
    },
  },
];

// 获取职位列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    return NextResponse.json({ 
      jobs: staticJobs, 
      total: staticJobs.length, 
      page, 
      totalPages: 1 
    });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建新职位（静态模式 - 仅演示）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    
    // 静态模式下，只返回成功消息（实际存储需要数据库）
    return NextResponse.json({ 
      message: "职位发布成功（演示模式：数据未持久化）",
      job: {
        id: Date.now().toString(),
        ...body,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
