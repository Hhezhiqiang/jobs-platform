import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

// 获取过去N天的日期数组
function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(subDays(new Date(), i));
  }
  return days;
}

// 格式化日期为YYYY-MM-DD
function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// 获取访问统计数据（模拟数据，基于实际页面浏览量）
export async function getVisitStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  // 获取所有职位和博客的总浏览量
  const [jobViews, blogViews] = await Promise.all([
    prisma.job.aggregate({
      _sum: { viewCount: true },
    }),
    prisma.page.aggregate({
      where: { type: "BLOG" },
      _sum: { viewCount: true },
    }),
  ]);

  const totalViews = (jobViews._sum.viewCount || 0) + (blogViews._sum.viewCount || 0);
  
  // 模拟每日PV/UV数据（基于实际数据生成合理分布）
  const dailyAvg = Math.max(Math.floor(totalViews / 90), 50); // 过去90天平均，至少50
  
  const dailyStats = dateRange.map((date) => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
    const weekendFactor = isWeekend ? 0.6 : 1.0;
    
    const pv = Math.floor(dailyAvg * randomFactor * weekendFactor);
    const uv = Math.floor(pv * (0.4 + Math.random() * 0.3)); // UV约为PV的40-70%
    
    return {
      date: formatDateKey(date),
      dateDisplay: format(date, "MM/dd"),
      pv,
      uv,
    };
  });

  const totalPV = dailyStats.reduce((sum, d) => sum + d.pv, 0);
  const totalUV = dailyStats.reduce((sum, d) => sum + d.uv, 0);

  return {
    dailyStats,
    summary: {
      totalPV,
      totalUV,
      avgPV: Math.floor(totalPV / days),
      avgUV: Math.floor(totalUV / days),
      pvGrowth: +(Math.random() * 20 + 5).toFixed(1), // 模拟增长率 5-25%
      uvGrowth: +(Math.random() * 18 + 3).toFixed(1), // 模拟增长率 3-21%
    },
  };
}

// 获取申请转化率统计
export async function getApplicationConversionStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  // 获取职位浏览数据
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      viewCount: true,
      createdAt: true,
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // 获取申请数据
  const applications = await prisma.jobApplication.findMany({
    select: {
      id: true,
      appliedAt: true,
    },
    where: {
      appliedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // 按日期分组统计
  const stats = dateRange.map((date) => {
    const dateKey = formatDateKey(date);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // 当日浏览量（所有职位的浏览量累加，按创建时间分布估算）
    const dayViews = jobs
      .filter((job) => job.createdAt <= dayEnd)
      .reduce((sum, job) => sum + Math.floor(job.viewCount / 30), 0);

    // 当日申请数
    const dayApplications = applications.filter(
      (app) => app.appliedAt >= dayStart && app.appliedAt <= dayEnd
    ).length;

    const conversionRate = dayViews > 0 ? (dayApplications / dayViews) * 100 : 0;

    return {
      date: dateKey,
      dateDisplay: format(date, "MM/dd"),
      views: dayViews,
      applications: dayApplications,
      conversionRate: +conversionRate.toFixed(2),
    };
  });

  const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
  const totalApplications = stats.reduce((sum, s) => sum + s.applications, 0);
  const avgConversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

  return {
    dailyStats: stats,
    summary: {
      totalViews,
      totalApplications,
      avgConversionRate: +avgConversionRate.toFixed(2),
      conversionGrowth: +(Math.random() * 15 - 5).toFixed(1), // 模拟增长率 -5% 到 10%
    },
  };
}

// 获取热门职位排行
export async function getTopJobs(limit: number = 10) {
  const jobs = await prisma.job.findMany({
    take: limit,
    orderBy: { viewCount: "desc" },
    include: {
      company: true,
      _count: {
        select: { applications: true },
      },
    },
    where: {
      status: "ACTIVE",
    },
  });

  return jobs.map((job, index) => ({
    rank: index + 1,
    id: job.id,
    title: job.title,
    company: job.company.name,
    viewCount: job.viewCount,
    applicationCount: job._count.applications,
    conversionRate: job.viewCount > 0 
      ? +((job._count.applications / job.viewCount) * 100).toFixed(2)
      : 0,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  }));
}

// 获取用户增长趋势
export async function getUserGrowthStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      createdAt: true,
    },
    where: {
      createdAt: {
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 计算累计用户数
  let cumulativeCount = 0;
  const dailyStats = dateRange.map((date) => {
    const dayEnd = endOfDay(date);
    
    // 计算当天新增
    const newUsers = users.filter(
      (user) => user.createdAt >= startOfDay(date) && user.createdAt <= dayEnd
    ).length;
    
    // 计算累计（截至当天）
    cumulativeCount = users.filter((user) => user.createdAt <= dayEnd).length;

    return {
      date: formatDateKey(date),
      dateDisplay: format(date, "MM/dd"),
      newUsers,
      cumulativeUsers: cumulativeCount,
    };
  });

  const totalNewUsers = dailyStats.reduce((sum, d) => sum + d.newUsers, 0);
  const avgDailyNewUsers = Math.floor(totalNewUsers / days);

  return {
    dailyStats,
    summary: {
      totalUsers: cumulativeCount,
      totalNewUsers,
      avgDailyNewUsers,
      growthRate: +(Math.random() * 25 + 10).toFixed(1), // 模拟增长率 10-35%
    },
  };
}

// 获取职位增长趋势
export async function getJobGrowthStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  // 获取所有职位
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      createdAt: true,
      status: true,
    },
    where: {
      createdAt: {
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 计算每日统计
  const dailyStats = dateRange.map((date) => {
    const dayEnd = endOfDay(date);
    
    // 当天新增职位
    const newJobs = jobs.filter(
      (job) => job.createdAt >= startOfDay(date) && job.createdAt <= dayEnd
    ).length;
    
    // 累计活跃职位
    const activeJobs = jobs.filter(
      (job) => job.createdAt <= dayEnd && job.status === "ACTIVE"
    ).length;

    return {
      date: formatDateKey(date),
      dateDisplay: format(date, "MM/dd"),
      newJobs,
      activeJobs,
    };
  });

  const totalNewJobs = dailyStats.reduce((sum, d) => sum + d.newJobs, 0);
  const currentActiveJobs = dailyStats[dailyStats.length - 1]?.activeJobs || 0;

  return {
    dailyStats,
    summary: {
      totalJobs: jobs.length,
      currentActiveJobs,
      totalNewJobs,
      avgDailyNewJobs: +(totalNewJobs / days).toFixed(1),
      activeRate: jobs.length > 0 
        ? +((currentActiveJobs / jobs.length) * 100).toFixed(1)
        : 0,
    },
  };
}

// 获取概览统计数据
export async function getAnalyticsOverview() {
  const [
    visitStats,
    conversionStats,
    topJobs,
    userGrowth,
    jobGrowth,
  ] = await Promise.all([
    getVisitStats(30),
    getApplicationConversionStats(30),
    getTopJobs(10),
    getUserGrowthStats(30),
    getJobGrowthStats(30),
  ]);

  return {
    visitStats,
    conversionStats,
    topJobs,
    userGrowth,
    jobGrowth,
  };
}
