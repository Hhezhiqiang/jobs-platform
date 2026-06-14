import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';
import {
  calculateCultureMatch,
  calculateCultureMatchDetailed,
  isCultureFit,
  getMatchLevel,
  CultureMatchResult,
} from "@/lib/matching/culture-match";

export const dynamic = "force-dynamic";

// 匹配结果缓存（内存缓存，可选的Redis替代方案）
const matchCache = new Map<string, { result: CultureMatchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

interface RecommendedJob {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  requirements: string | null;
  benefits: string | null;
  employmentType: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  location: string;
  city: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  applyUrl: string;
  datePosted: Date;
  company: {
    id: string;
    name: string;
    nameEn: string | null;
    logo: string | null;
    slug: string;
  };
  cultureMatch: {
    score: number;
    isCultureFit: boolean;
    level: string;
    color: string;
    matchedTags: { tagName: string; voteCount: number; weight: number }[];
  } | null;
}

/**
 * GET /api/jobs/recommended
 * 获取基于用户偏好的推荐职位
 * 
 * 查询参数:
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - usePreferences: 是否使用用户偏好（默认true）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const usePreferences = searchParams.get("usePreferences") !== "false";

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 获取用户求职偏好
    let userPreferences: {
      cultureTags: string[];
      salaryMin: number | null;
      salaryMax: number | null;
      employmentTypes: string[];
      locations: string[];
      remotePreference: string | null;
      experienceLevel: string | null;
    } | null = null;

    if (usePreferences && userId) {
      userPreferences = await prisma.user_job_preferences.findUnique({
        where: { userId },
      });
    }

    // 构建职位查询条件
    const whereConditions: any = {
      status: "ACTIVE",
    };

    // 根据用户偏好添加筛选条件
    if (userPreferences) {
      // 工作地点筛选
      if (userPreferences.locations && userPreferences.locations.length > 0) {
        whereConditions.city = {
          in: userPreferences.locations,
          mode: "insensitive",
        };
      }

      // 工作类型筛选
      if (
        userPreferences.employmentTypes &&
        userPreferences.employmentTypes.length > 0
      ) {
        whereConditions.employmentType = {
          in: userPreferences.employmentTypes,
        };
      }

      // 经验级别筛选
      if (userPreferences.experienceLevel) {
        whereConditions.experience = userPreferences.experienceLevel;
      }

      // 远程偏好筛选
      if (userPreferences.remotePreference) {
        switch (userPreferences.remotePreference) {
          case "FULL_REMOTE":
            whereConditions.isRemote = true;
            break;
          case "HYBRID":
            whereConditions.isHybrid = true;
            break;
          case "ONSITE":
            whereConditions.isRemote = false;
            whereConditions.isHybrid = false;
            break;
        }
      }

      // 薪资范围筛选（宽松匹配，显示薪资范围有重叠的职位）
      if (userPreferences.salaryMin !== null || userPreferences.salaryMax !== null) {
        whereConditions.AND = whereConditions.AND || [];
        
        // 职位的薪资范围与用户的期望有重叠即可
        whereConditions.AND.push({
          OR: [
            // 职位没有设置薪资，或者
            { salaryMin: null },
            // 职位的最高薪资 >= 用户的最低期望
            { salaryMax: { gte: userPreferences.salaryMin ?? 0 } },
            // 职位的最低薪资 <= 用户的最高期望
            { salaryMin: { lte: userPreferences.salaryMax ?? 9999999 } },
          ],
        });
      }
    }

    // 获取职位总数
    const total = await prisma.jobs.count({ where: whereConditions });

    // 获取职位列表
    const jobs = await prisma.jobs.findMany({
      where: whereConditions,
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            logo: true,
            slug: true,
          },
        },
      },
      orderBy: { datePosted: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 获取所有相关公司的文化标签
    const companyIds = jobs.map((job) => job.companyId);
    const companyTagsMap = await fetchCompanyTags(companyIds);

    // 计算每个职位的文化匹配度
    const recommendedJobs: RecommendedJob[] = jobs.map((job) => {
      let cultureMatch = null;

      if (userPreferences && userPreferences.cultureTags.length > 0) {
        const companyTags = companyTagsMap.get(job.companyId) || [];

        // 使用缓存或计算匹配度
        const cacheKey = `${userId}:${job.companyId}`;
        let matchResult: CultureMatchResult;

        const cached = matchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          matchResult = cached.result;
        } else {
          matchResult = calculateCultureMatchDetailed(
            userPreferences.cultureTags,
            companyTags
          );
          matchCache.set(cacheKey, {
            result: matchResult,
            timestamp: Date.now(),
          });
        }

        const level = getMatchLevel(matchResult.score);

        cultureMatch = {
          score: matchResult.score,
          isCultureFit: isCultureFit(matchResult.score),
          level: level.label,
          color: level.color,
          matchedTags: matchResult.matchedTags,
        };
      }

      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        titleEn: job.titleEn,
        description: job.description,
        descriptionEn: job.descriptionEn,
        requirements: job.requirements,
        benefits: job.benefits,
        employmentType: job.employmentType,
        experience: job.experience,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        location: job.location,
        city: job.city,
        isRemote: job.isRemote,
        isHybrid: job.isHybrid,
        applyUrl: job.applyUrl,
        datePosted: job.datePosted,
        company: {
          id: job.companies.id,
          name: job.companies.name,
          nameEn: job.companies.nameEn,
          logo: job.companies.logo,
          slug: job.companies.slug,
        },
        cultureMatch,
      };
    });

    // 按匹配度排序（有匹配度的排在前面，匹配度高的在前）
    recommendedJobs.sort((a, b) => {
      const scoreA = a.cultureMatch?.score ?? 0;
      const scoreB = b.cultureMatch?.score ?? 0;

      // 如果都有匹配度，按分数降序
      if (a.cultureMatch && b.cultureMatch) {
        return scoreB - scoreA;
      }
      // 如果有匹配度的排前面
      if (a.cultureMatch && !b.cultureMatch) return -1;
      if (!a.cultureMatch && b.cultureMatch) return 1;
      // 都没有匹配度，按日期
      return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
    });

    return NextResponse.json({
      jobs: recommendedJobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasPreferences: !!userPreferences,
      preferences: userPreferences
        ? {
            cultureTags: userPreferences.cultureTags,
            locations: userPreferences.locations,
          }
        : null,
    });
  } catch (error) {
    logger.error("获取推荐职位失败:", error);
    return NextResponse.json(
      { error: "获取推荐职位失败" },
      { status: 500 }
    );
  }
}

/**
 * 批量获取公司文化标签
 */
async function fetchCompanyTags(
  companyIds: string[]
): Promise<Map<string, { tagName: string; voteCount: number }[]>> {
  const companyTagsMap = new Map<string, { tagName: string; voteCount: number }[]>();

  if (companyIds.length === 0) {
    return companyTagsMap;
  }

  // 获取所有相关公司的标签数据
  const tags = await prisma.company_culture_tags.findMany({
    where: {
      companyId: { in: companyIds },
    },
    select: {
      companyId: true,
      tagName: true,
      voteCount: true,
    },
  });

  // 按公司ID分组
  for (const tag of tags) {
    const existing = companyTagsMap.get(tag.companyId) || [];
    existing.push({
      tagName: tag.tagName,
      voteCount: tag.voteCount,
    });
    companyTagsMap.set(tag.companyId, existing);
  }

  return companyTagsMap;
}
