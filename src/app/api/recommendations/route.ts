import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore, getRecommendationWeight } from "@/lib/recommendations";
import { Job, Company } from "@prisma/client";

interface JobWithCompany extends Job {
  company: Company;
}

interface RecommendationResponse {
  jobs: Array<JobWithCompany & { matchScore: number; matchReasons: string[] }>;
  total: number;
  isPersonalized: boolean;
  userSkills?: string[];
}

/**
 * GET /api/recommendations
 * 
 * 获取推荐职位列表
 * 支持两种模式：
 * 1. 已登录用户：基于用户资料、申请历史、浏览历史推荐
 * 2. 未登录用户：返回热门职位
 * 
 * Query Parameters:
 * - limit: 返回数量（默认6，最大20）
 * - offset: 偏移量（用于分页）
 * - skills: 技能标签（逗号分隔，可选，覆盖用户资料中的技能）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 20);
    const offset = parseInt(searchParams.get("offset") || "0");
    const skillsParam = searchParams.get("skills");

    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user?.id;

    let userSkills: string[] = [];
    let appliedJobIds: string[] = [];
    let isPersonalized = false;

    // 获取用户数据（如果已登录）
    if (isLoggedIn) {
      const [profile, applications] = await Promise.all([
        prisma.userProfile.findUnique({
          where: { userId: session.user.id },
          select: { skills: true },
        }),
        prisma.jobApplication.findMany({
          where: { userId: session.user.id },
          select: { jobId: true },
        }),
      ]);

      if (profile?.skills) {
        userSkills = profile.skills;
      }
      appliedJobIds = applications.map(app => app.jobId);
    }

    // 如果提供了技能参数，覆盖用户资料中的技能
    if (skillsParam) {
      userSkills = skillsParam.split(",").map(s => s.trim()).filter(Boolean);
      isPersonalized = true;
    } else if (userSkills.length > 0) {
      isPersonalized = true;
    }

    // 获取活跃职位
    const activeJobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        // 排除已申请的职位（如果用户已登录）
        ...(appliedJobIds.length > 0 && {
          id: { notIn: appliedJobIds },
        }),
        // 确保职位未过期
        OR: [
          { validThrough: null },
          { validThrough: { gt: new Date() } },
        ],
      },
      include: {
        company: true,
      },
    });

    let recommendedJobs: Array<JobWithCompany & { matchScore: number; matchReasons: string[] }> = [];

    if (isPersonalized && userSkills.length > 0) {
      // 个性化推荐模式
      const behaviorData = {
        viewedJobs: [],
        viewedAt: {},
        appliedJobs: appliedJobIds,
        skills: userSkills,
        lastUpdated: Date.now(),
      };

      // 计算每个职位的匹配分数
      const scoredJobs = activeJobs.map(job => {
        const { score, reasons } = calculateMatchScore(job, behaviorData);
        return {
          ...job,
          matchScore: score,
          matchReasons: reasons,
        };
      });

      // 按推荐权重排序（匹配度 + 时间因素）
      recommendedJobs = scoredJobs
        .map(job => ({
          ...job,
          weight: getRecommendationWeight(job, job.matchScore),
        }))
        .sort((a, b) => b.weight - a.weight)
        .slice(offset, offset + limit);

    } else {
      // 非个性化推荐：返回热门职位 + 最新职位混合
      const featuredJobs = activeJobs.filter(job => job.isFeatured);
      const latestJobs = activeJobs
        .filter(job => !job.isFeatured)
        .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
        .slice(0, limit * 2);

      // 混合排序：热门职位优先，然后是按时间排序的其他职位
      const mixedJobs = [...featuredJobs, ...latestJobs]
        .slice(0, offset + limit)
        .slice(offset);

      recommendedJobs = mixedJobs.map(job => ({
        ...job,
        matchScore: job.isFeatured ? 80 : 50,
        matchReasons: job.isFeatured ? ["热门职位"] : ["新发布职位"],
      }));
    }

    // 构建响应
    const response: RecommendationResponse = {
      jobs: recommendedJobs,
      total: activeJobs.length,
      isPersonalized,
      ...(isPersonalized && { userSkills }),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "获取推荐职位失败", jobs: [], total: 0, isPersonalized: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations/track
 * 
 * 记录用户行为（用于个性化推荐）
 * 
 * Body:
 * - action: "view" | "apply"
 * - jobId: string
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { action, jobId } = body;

    if (!action || !jobId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 可以在这里添加服务器端的用户行为追踪
    // 例如：记录到数据库或发送到分析服务

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Track recommendation error:", error);
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}
