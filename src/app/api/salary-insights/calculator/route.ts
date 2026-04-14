export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { jobTitle, experience, city, industry } = await request.json();

    // 构建查询条件
    const where: any = {
      status: "ACTIVE",
      AND: [
        { salaryMin: { not: null } },
        { salaryMax: { not: null } },
      ],
    };

    if (jobTitle) {
      where.OR = [
        { title: { contains: jobTitle, mode: "insensitive" } },
        { description: { contains: jobTitle, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = city;
    }

    if (industry) {
      where.companies = { industry };
    }

    const jobs = await prisma.jobs.findMany({
      where,
      include: { companies: true },
    });

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "未找到匹配的职位数据，请尝试其他关键词",
      });
    }

    // 根据经验调整薪资预期
    const experienceMultiplier = getExperienceMultiplier(experience);

    const salaries = jobs.map((j) =>
      ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2
    );
    const adjustedSalaries = salaries.map((s) => s * experienceMultiplier);

    const avgSalary = Math.round(
      adjustedSalaries.reduce((a, b) => a + b, 0) / adjustedSalaries.length
    );
    const sorted = adjustedSalaries.sort((a, b) => a - b);
    const minSalary = Math.round(sorted[0]);
    const maxSalary = Math.round(sorted[sorted.length - 1]);
    const medianSalary = Math.round(sorted[Math.floor(sorted.length / 2)]);

    // 计算置信度
    const confidence = Math.min(jobs.length / 10, 1) * 100;

    return NextResponse.json({
      success: true,
      data: {
        estimatedSalary: avgSalary,
        salaryRange: {
          min: minSalary,
          max: maxSalary,
          median: medianSalary,
        },
        sampleSize: jobs.length,
        confidence: Math.round(confidence),
        experienceAdjustment: experienceMultiplier,
        currency: "CNY",
        period: "YEAR",
      },
    });
  } catch (error) {
    console.error("Salary calculator API error:", error);
    return NextResponse.json(
      { success: false, error: "计算薪资失败" },
      { status: 500 }
    );
  }
}

function getExperienceMultiplier(experience: string): number {
  const multipliers: Record<string, number> = {
    "0-1": 0.85,
    "1-3": 0.95,
    "3-5": 1.0,
    "5-8": 1.15,
    "8-10": 1.3,
    "10+": 1.5,
  };
  return multipliers[experience] || 1.0;
}
