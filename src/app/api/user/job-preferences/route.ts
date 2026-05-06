import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

/**
 * GET /api/user/job-preferences
 * 获取用户求职偏好（期望标签、薪资范围等）
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const preferences = await prisma.userJobPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // 如果没有找到偏好设置，返回默认空对象
    if (!preferences) {
      return NextResponse.json({
        userId: session.user.id,
        cultureTags: [],
        salaryMin: null,
        salaryMax: null,
        employmentTypes: [],
        locations: [],
        remotePreference: null,
        experienceLevel: null,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      userId: preferences.userId,
      cultureTags: preferences.cultureTags,
      salaryMin: preferences.salaryMin,
      salaryMax: preferences.salaryMax,
      employmentTypes: preferences.employmentTypes,
      locations: preferences.locations,
      remotePreference: preferences.remotePreference,
      experienceLevel: preferences.experienceLevel,
      updatedAt: preferences.updatedAt,
    });
  } catch (error) {
    logger.error("获取求职偏好失败:", error);
    return NextResponse.json({ error: "获取求职偏好失败" }, { status: 500 });
  }
}

/**
 * POST /api/user/job-preferences
 * 更新用户求职偏好
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      cultureTags,       // 期望的公司文化标签 ["扁平管理", "技术驱动"]
      salaryMin,       // 最低期望薪资
      salaryMax,       // 最高期望薪资
      employmentTypes, // 期望的工作类型 ["FULL_TIME", "CONTRACT"]
      locations,       // 期望的工作地点 ["北京", "上海"]
      remotePreference, // 远程偏好 "FULL_REMOTE" | "HYBRID" | "ONSITE"
      experienceLevel, // 期望的经验级别 "ENTRY" | "MID" | "SENIOR" | "EXECUTIVE"
    } = body;

    // 验证文化标签
    if (cultureTags !== undefined) {
      if (!Array.isArray(cultureTags)) {
        return NextResponse.json(
          { error: "cultureTags 必须是数组" },
          { status: 400 }
        );
      }
      if (cultureTags.length > 10) {
        return NextResponse.json(
          { error: "文化标签最多选择10个" },
          { status: 400 }
        );
      }
    }

    // 验证薪资范围
    if (salaryMin !== undefined && salaryMax !== undefined) {
      if (salaryMin > salaryMax) {
        return NextResponse.json(
          { error: "最低薪资不能高于最高薪资" },
          { status: 400 }
        );
      }
    }

    // 验证工作类型
    const validEmploymentTypes = [
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERNSHIP",
      "FREELANCE",
    ];
    if (employmentTypes !== undefined) {
      if (!Array.isArray(employmentTypes)) {
        return NextResponse.json(
          { error: "employmentTypes 必须是数组" },
          { status: 400 }
        );
      }
      const invalidTypes = employmentTypes.filter(
        (t) => !validEmploymentTypes.includes(t)
      );
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `无效的工作类型: ${invalidTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // 验证远程偏好
    const validRemotePreferences = ["FULL_REMOTE", "HYBRID", "ONSITE", "ANY"];
    if (remotePreference !== undefined && !validRemotePreferences.includes(remotePreference)) {
      return NextResponse.json(
        { error: "无效的远程偏好设置" },
        { status: 400 }
      );
    }

    // 验证经验级别
    const validExperienceLevels = ["ENTRY", "MID", "SENIOR", "EXECUTIVE"];
    if (experienceLevel !== undefined && !validExperienceLevels.includes(experienceLevel)) {
      return NextResponse.json(
        { error: "无效的经验级别" },
        { status: 400 }
      );
    }

    // 创建或更新求职偏好
    const preferences = await prisma.userJobPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        cultureTags: cultureTags || [],
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        employmentTypes: employmentTypes || [],
        locations: locations || [],
        remotePreference: remotePreference ?? null,
        experienceLevel: experienceLevel ?? null,
      },
      update: {
        ...(cultureTags !== undefined && { cultureTags }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ?? null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ?? null }),
        ...(employmentTypes !== undefined && { employmentTypes }),
        ...(locations !== undefined && { locations }),
        ...(remotePreference !== undefined && { remotePreference }),
        ...(experienceLevel !== undefined && { experienceLevel }),
      },
    });

    return NextResponse.json({
      message: "求职偏好更新成功",
      preferences: {
        userId: preferences.userId,
        cultureTags: preferences.cultureTags,
        salaryMin: preferences.salaryMin,
        salaryMax: preferences.salaryMax,
        employmentTypes: preferences.employmentTypes,
        locations: preferences.locations,
        remotePreference: preferences.remotePreference,
        experienceLevel: preferences.experienceLevel,
        updatedAt: preferences.updatedAt,
      },
    });
  } catch (error) {
    logger.error("更新求职偏好失败:", error);
    return NextResponse.json({ error: "更新求职偏好失败" }, { status: 500 });
  }
}
