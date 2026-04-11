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

// 获取访问统计数据（基于真实PageView数据）
export async function getVisitStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  // 获取真实的页面访问数据
  const pageViews = await prisma.pageView.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      sessionId: true,
      createdAt: true,
    },
  });

  // 按日期分组统计 PV 和 UV
  const dailyStats = dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // 当天的所有访问
    const dayViews = pageViews.filter(
      (pv) => pv.createdAt >= dayStart && pv.createdAt <= dayEnd
    );

    // PV = 访问次数
    const pv = dayViews.length;

    // UV = 独立会话数
    const uniqueSessions = new Set(dayViews.map((v) => v.sessionId));
    const uv = uniqueSessions.size;

    return {
      date: formatDateKey(date),
      dateDisplay: format(date, "MM/dd"),
      pv,
      uv,
    };
  });

  const totalPV = dailyStats.reduce((sum, d) => sum + d.pv, 0);
  const totalUV = dailyStats.reduce((sum, d) => sum + d.uv, 0);

  // 计算增长率（与上一个周期比较）
  const prevStartDate = startOfDay(subDays(dateRange[0], days));
  const prevEndDate = endOfDay(subDays(dateRange[0], 1));

  const prevPageViews = await prisma.pageView.findMany({
    where: {
      createdAt: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
  });

  const prevPV = prevPageViews.length;
  const prevUV = new Set(prevPageViews.map((v) => v.sessionId)).size;

  const pvGrowth = prevPV > 0 ? +(((totalPV - prevPV) / prevPV) * 100).toFixed(1) : 0;
  const uvGrowth = prevUV > 0 ? +(((totalUV - prevUV) / prevUV) * 100).toFixed(1) : 0;

  return {
    dailyStats,
    summary: {
      totalPV,
      totalUV,
      avgPV: Math.floor(totalPV / days),
      avgUV: Math.floor(totalUV / days),
      pvGrowth,
      uvGrowth,
    },
  };
}

// 获取申请转化率统计（基于真实数据）
export async function getApplicationConversionStats(days: number = 30) {
  const dateRange = getLastNDays(days);

  // 获取真实的页面访问数据（职位详情页）
  const pageViews = await prisma.pageView.findMany({
    where: {
      path: { startsWith: "/jobs/" },
      createdAt: {
        gte: startOfDay(dateRange[0]),
        lte: endOfDay(dateRange[dateRange.length - 1]),
      },
    },
    select: {
      createdAt: true,
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
        gte: startOfDay(dateRange[0]),
        lte: endOfDay(dateRange[dateRange.length - 1]),
      },
    },
  });

  // 按日期分组统计
  const stats = dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dateKey = formatDateKey(date);

    // 当日职位详情页浏览量
    const dayViews = pageViews.filter(
      (pv) => pv.createdAt >= dayStart && pv.createdAt <= dayEnd
    ).length;

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

  // 计算转化率变化（与上一个周期比较）
  const prevDays = days;
  const prevStart = startOfDay(subDays(dateRange[0], prevDays));
  const prevEnd = endOfDay(subDays(dateRange[0], 1));

  const prevApplications = await prisma.jobApplication.count({
    where: {
      appliedAt: {
        gte: prevStart,
        lte: prevEnd,
      },
    },
  });

  const conversionGrowth =
    prevApplications > 0
      ? +(((totalApplications - prevApplications) / prevApplications) * 100).toFixed(1)
      : 0;

  return {
    dailyStats: stats,
    summary: {
      totalViews,
      totalApplications,
      avgConversionRate: +avgConversionRate.toFixed(2),
      conversionGrowth,
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

// 获取用户增长趋势（基于真实数据）
export async function getUserGrowthStats(days: number = 30) {
  const dateRange = getLastNDays(days);

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      createdAt: true,
    },
    where: {
      createdAt: {
        lte: endOfDay(dateRange[dateRange.length - 1]),
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

  // 计算增长率（与上一个周期比较）
  const prevDays = days;
  const prevStart = startOfDay(subDays(dateRange[0], prevDays));
  const prevEnd = endOfDay(subDays(dateRange[0], 1));

  const prevNewUsers = users.filter(
    (user) => user.createdAt >= prevStart && user.createdAt <= prevEnd
  ).length;

  const growthRate =
    prevNewUsers > 0
      ? +(((totalNewUsers - prevNewUsers) / prevNewUsers) * 100).toFixed(1)
      : totalNewUsers > 0
      ? 100
      : 0;

  return {
    dailyStats,
    summary: {
      totalUsers: cumulativeCount,
      totalNewUsers,
      avgDailyNewUsers: Math.floor(totalNewUsers / days),
      growthRate,
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
