import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';
import {
  calculateCultureMatchDetailed,
  isCultureFit,
  getMatchLevel,
} from "@/lib/matching/culture-match";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/[id]/culture-match
 * 获取指定职位的文化匹配度详情
 * 
 * 返回：
 * - 匹配度分数
 * - 匹配详情（哪些标签匹配）
 * - 用户求职偏好
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { id: jobId } = params;

    // 获取职位信息
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    // 获取公司文化标签
    const companyTags = await prisma.company_culture_tags.findMany({
      where: { companyId: job.companyId },
      select: {
        tagName: true,
        voteCount: true,
      },
      orderBy: { voteCount: "desc" },
    });

    // 如果用户未登录，返回公司标签信息但不计算匹配度
    if (!userId) {
      return NextResponse.json({
        jobId,
        company: job.companies,
        companyTags,
        hasMatch: false,
        message: "登录后查看文化匹配度",
      });
    }

    // 获取用户求职偏好
    const preferences = await prisma.user_job_preferences.findUnique({
      where: { userId },
    });

    // 如果用户没有设置偏好，返回提示
    if (!preferences || preferences.cultureTags.length === 0) {
      return NextResponse.json({
        jobId,
        company: job.companies,
        companyTags,
        hasMatch: false,
        userPreferences: preferences,
        message: "设置求职偏好后查看匹配度",
      });
    }

    // 计算文化匹配度
    const matchResult = calculateCultureMatchDetailed(
      preferences.cultureTags,
      companyTags
    );

    const level = getMatchLevel(matchResult.score);

    return NextResponse.json({
      jobId,
      company: job.companies,
      companyTags,
      hasMatch: true,
      matchResult: {
        score: matchResult.score,
        isCultureFit: isCultureFit(matchResult.score),
        level: level.label,
        color: level.color,
        matchedTags: matchResult.matchedTags,
        unmatchedTags: matchResult.unmatchedTags,
      },
      userPreferences: {
        cultureTags: preferences.cultureTags,
        salaryMin: preferences.salaryMin,
        salaryMax: preferences.salaryMax,
        locations: preferences.locations,
        remotePreference: preferences.remotePreference,
        experienceLevel: preferences.experienceLevel,
      },
    });
  } catch (error) {
    logger.error("获取文化匹配度失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
