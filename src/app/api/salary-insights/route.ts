export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 获取所有有薪资信息的职位
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          { salaryMin: { not: null } },
          { salaryMax: { not: null } },
        ],
      },
      select: {
        id: true,
        title: true,
        salaryMin: true,
        salaryMax: true,
        employmentType: true,
        city: true,
        datePosted: true,
        company: {
          select: {
            industry: true,
          },
        },
      },
      take: 5000,
    });

    // 计算各行业平均薪资
    const industryData = calculateIndustryStats(jobs);

    // 计算各城市薪资分布
    const cityData = calculateCityStats(jobs);

    // 计算薪资趋势（近6个月）
    const trendData = calculateTrendStats(jobs);

    // 计算职位类型薪资
    const jobTypeData = calculateJobTypeStats(jobs);

    // 总体统计
    const overview = calculateOverview(jobs);

    return NextResponse.json({
      success: true,
      data: {
        overview,
        industry: industryData,
        city: cityData,
        trend: trendData,
        jobType: jobTypeData,
      },
    });
  } catch (error) {
    console.error("Salary insights API error:", error);
    return NextResponse.json(
      { success: false, error: "获取薪资数据失败" },
      { status: 500 }
    );
  }
}

function calculateIndustryStats(jobs: any[]) {
  const industryMap = new Map();

  jobs.forEach((job) => {
    const industry = job.company?.industry || "其他";
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (!industryMap.has(industry)) {
      industryMap.set(industry, { salaries: [], count: 0 });
    }
    const data = industryMap.get(industry);
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(industryMap.entries())
    .map(([industry, data]: [string, any]) => ({
      industry,
      avgSalary: Math.round(data.salaries.reduce((a: number, b: number) => a + b, 0) / data.salaries.length),
      count: data.count,
      min: Math.round(Math.min(...data.salaries)),
      max: Math.round(Math.max(...data.salaries)),
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 10);
}

function calculateCityStats(jobs: any[]) {
  const cityMap = new Map();

  jobs.forEach((job) => {
    const city = job.city || "未知";
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (!cityMap.has(city)) {
      cityMap.set(city, { salaries: [], count: 0 });
    }
    const data = cityMap.get(city);
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(cityMap.entries())
    .map(([city, data]: [string, any]) => ({
      city,
      avgSalary: Math.round(data.salaries.reduce((a: number, b: number) => a + b, 0) / data.salaries.length),
      count: data.count,
      median: Math.round(data.salaries.sort((a: number, b: number) => a - b)[Math.floor(data.salaries.length / 2)]),
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 12);
}

function calculateTrendStats(jobs: any[]) {
  const months: { month: string; avgSalary: number; count: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: monthKey, avgSalary: 0, count: 0 });
  }

  const monthMap = new Map();
  jobs.forEach((job) => {
    const posted = new Date(job.datePosted);
    const monthKey = `${posted.getFullYear()}-${String(posted.getMonth() + 1).padStart(2, "0")}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { salaries: [], count: 0 });
    }
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;
    const data = monthMap.get(monthKey);
    data.salaries.push(avgSalary);
    data.count++;
  });

  return months.map((m) => {
    const data = monthMap.get(m.month);
    return {
      month: m.month,
      avgSalary: data ? Math.round(data.salaries.reduce((a: number, b: number) => a + b, 0) / data.salaries.length) : 0,
      count: data ? data.count : 0,
    };
  });
}

function calculateJobTypeStats(jobs: any[]) {
  const typeMap = new Map();

  const typeNames: Record<string, string> = {
    FULL_TIME: "全职",
    PART_TIME: "兼职",
    CONTRACT: "合同",
    INTERNSHIP: "实习",
    FREELANCE: "自由职业",
  };

  jobs.forEach((job) => {
    const type = typeNames[job.employmentType] || "其他";
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (!typeMap.has(type)) {
      typeMap.set(type, { salaries: [], count: 0 });
    }
    const data = typeMap.get(type);
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(typeMap.entries())
    .map(([type, data]: [string, any]) => ({
      type,
      avgSalary: Math.round(data.salaries.reduce((a: number, b: number) => a + b, 0) / data.salaries.length),
      count: data.count,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary);
}

function calculateOverview(jobs: any[]) {
  if (jobs.length === 0) {
    return {
      totalJobs: 0,
      avgSalary: 0,
      medianSalary: 0,
      salaryRange: { min: 0, max: 0 },
    };
  }

  const salaries = jobs.map((j) => ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2);
  const sorted = salaries.sort((a, b) => a - b);

  return {
    totalJobs: jobs.length,
    avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
    medianSalary: Math.round(sorted[Math.floor(sorted.length / 2)]),
    salaryRange: {
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
    },
  };
}
