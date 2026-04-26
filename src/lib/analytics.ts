import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(subDays(new Date(), i));
  }
  return days;
}

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export async function getVisitStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  const rows = await prisma.$queryRaw<
    Array<{ date: Date; pv: bigint; uv: bigint }>
  >`
    SELECT DATE("createdAt") as date,
           COUNT(*) as pv,
           COUNT(DISTINCT "sessionId") as uv
    FROM page_views
    WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  const map = new Map(
    rows.map((r) => [formatDateKey(r.date), { pv: Number(r.pv), uv: Number(r.uv) }])
  );

  const dailyStats = dateRange.map((date) => {
    const key = formatDateKey(date);
    const stat = map.get(key) || { pv: 0, uv: 0 };
    return {
      date: key,
      dateDisplay: format(date, "MM/dd"),
      pv: stat.pv,
      uv: stat.uv,
    };
  });

  const totalPV = dailyStats.reduce((sum, d) => sum + d.pv, 0);
  const totalUV = dailyStats.reduce((sum, d) => sum + d.uv, 0);

  // Previous period
  const prevStartDate = startOfDay(subDays(dateRange[0], days));
  const prevEndDate = endOfDay(subDays(dateRange[0], 1));
  const prevRows = await prisma.$queryRaw<
    Array<{ pv: bigint; uv: bigint }>
  >`
    SELECT COUNT(*) as pv, COUNT(DISTINCT "sessionId") as uv
    FROM page_views
    WHERE "createdAt" >= ${prevStartDate} AND "createdAt" <= ${prevEndDate}
  `;
  const prev = prevRows[0] || { pv: BigInt(0), uv: BigInt(0) };
  const prevPV = Number(prev.pv);
  const prevUV = Number(prev.uv);

  return {
    dailyStats,
    summary: {
      totalPV,
      totalUV,
      avgPV: Math.floor(totalPV / days),
      avgUV: Math.floor(totalUV / days),
      pvGrowth: prevPV > 0 ? +(((totalPV - prevPV) / prevPV) * 100).toFixed(1) : 0,
      uvGrowth: prevUV > 0 ? +(((totalUV - prevUV) / prevUV) * 100).toFixed(1) : 0,
    },
  };
}

export async function getApplicationConversionStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  const viewRows = await prisma.$queryRaw<
    Array<{ date: Date; views: bigint }>
  >`
    SELECT DATE("createdAt") as date, COUNT(*) as views
    FROM page_views
    WHERE path LIKE '/jobs/%'
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  const appRows = await prisma.$queryRaw<
    Array<{ date: Date; applications: bigint }>
  >`
    SELECT DATE("appliedAt") as date, COUNT(*) as applications
    FROM job_applications
    WHERE "appliedAt" >= ${startDate}
      AND "appliedAt" <= ${endDate}
    GROUP BY DATE("appliedAt")
    ORDER BY date ASC
  `;

  const viewMap = new Map(
    viewRows.map((r) => [formatDateKey(r.date), Number(r.views)])
  );
  const appMap = new Map(
    appRows.map((r) => [formatDateKey(r.date), Number(r.applications)])
  );

  const stats = dateRange.map((date) => {
    const key = formatDateKey(date);
    const views = viewMap.get(key) || 0;
    const applications = appMap.get(key) || 0;
    return {
      date: key,
      dateDisplay: format(date, "MM/dd"),
      views,
      applications,
      conversionRate: views > 0 ? +(applications / views * 100).toFixed(2) : 0,
    };
  });

  const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
  const totalApplications = stats.reduce((sum, s) => sum + s.applications, 0);
  const avgConversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

  const prevStart = startOfDay(subDays(dateRange[0], days));
  const prevEnd = endOfDay(subDays(dateRange[0], 1));
  const prevApplications = await prisma.job_applications.count({
    where: { appliedAt: { gte: prevStart, lte: prevEnd } },
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

export async function getTopJobs(limit: number = 10) {
  const jobs = await prisma.jobs.findMany({
    take: limit,
    orderBy: { viewCount: "desc" },
    include: {
      companies: true,
      _count: {
        select: { job_applications: true },
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
    company: job.companies.name,
    viewCount: job.viewCount,
    applicationCount: job._count.job_applications,
    conversionRate: job.viewCount > 0
      ? +((job._count.job_applications / job.viewCount) * 100).toFixed(2)
      : 0,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  }));
}

export async function getUserGrowthStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  const userRows = await prisma.$queryRaw<
    Array<{ date: Date; newUsers: bigint }>
  >`
    SELECT DATE("createdAt") as date, COUNT(*) as newUsers
    FROM users
    WHERE "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // 获取截至 startDate 前一天的总用户数（作为累加基数）
  const baseCount = await prisma.users.count({
    where: { createdAt: { lt: startDate } },
  });

  const userMap = new Map(
    userRows.map((r) => [formatDateKey(r.date), Number(r.newUsers)])
  );

  let cumulativeCount = baseCount;
  const dailyStats = dateRange.map((date) => {
    const key = formatDateKey(date);
    const newUsers = userMap.get(key) || 0;
    cumulativeCount += newUsers;
    return {
      date: key,
      dateDisplay: format(date, "MM/dd"),
      newUsers,
      cumulativeUsers: cumulativeCount,
    };
  });

  const totalNewUsers = dailyStats.reduce((sum, d) => sum + d.newUsers, 0);

  const prevStart = startOfDay(subDays(dateRange[0], days));
  const prevEnd = endOfDay(subDays(dateRange[0], 1));
  const prevNewUsers = await prisma.users.count({
    where: { createdAt: { gte: prevStart, lte: prevEnd } },
  });

  const growthRate =
    prevNewUsers > 0
      ? +(((totalNewUsers - prevNewUsers) / prevNewUsers) * 100).toFixed(1)
      : totalNewUsers > 0 ? 100 : 0;

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

export async function getJobGrowthStats(days: number = 30) {
  const dateRange = getLastNDays(days);
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  const jobRows = await prisma.$queryRaw<
    Array<{ date: Date; newJobs: bigint; activeJobs: bigint }>
  >`
    SELECT DATE("createdAt") as date,
           COUNT(*) as newJobs,
           COUNT(*) FILTER (WHERE status = 'ACTIVE') as activeJobs
    FROM jobs
    WHERE "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // 活跃职位需要是"截至当日"的累计，而不是当日创建的 active 数量。
  // 这里我们用一种近似：查询截至当天的总 active 数，然后填充。
  const jobMap = new Map(
    jobRows.map((r) => [
      formatDateKey(r.date),
      { newJobs: Number(r.newJobs), activeJobsCreatedThatDay: Number(r.activeJobs) },
    ])
  );

  // 更准确的累计活跃数：对于历史数据，最简单的方式是一次性 count 当前活跃数作为最后一天，
  // 但报告中要求每天的趋势。既然 job 的有效期通常较长，我们估算：
  // 先获取 endDate 之前的所有职位的 createdAt 和 status，但只查需要的字段且限制 90 天范围。
  const allJobsForActive = await prisma.jobs.findMany({
    where: {
      createdAt: { lte: endDate },
    },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  let runningActive = allJobsForActive.filter(
    (j) => j.createdAt < startDate && j.status === "ACTIVE"
  ).length;

  const dailyStats = dateRange.map((date) => {
    const key = formatDateKey(date);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const newJobs = allJobsForActive.filter(
      (j) => j.createdAt >= dayStart && j.createdAt <= dayEnd
    ).length;
    const dayActiveAdded = allJobsForActive.filter(
      (j) => j.createdAt >= dayStart && j.createdAt <= dayEnd && j.status === "ACTIVE"
    ).length;
    runningActive += dayActiveAdded;
    return {
      date: key,
      dateDisplay: format(date, "MM/dd"),
      newJobs,
      activeJobs: runningActive,
    };
  });

  const totalNewJobs = dailyStats.reduce((sum, d) => sum + d.newJobs, 0);
  const currentActiveJobs = dailyStats[dailyStats.length - 1]?.activeJobs || 0;
  const totalJobs = await prisma.jobs.count();

  return {
    dailyStats,
    summary: {
      totalJobs,
      currentActiveJobs,
      totalNewJobs,
      avgDailyNewJobs: +(totalNewJobs / days).toFixed(1),
      activeRate: totalJobs > 0 ? +((currentActiveJobs / totalJobs) * 100).toFixed(1) : 0,
    },
  };
}

export async function getAnalyticsOverview() {
  const [
    visitStats,
    conversionStats,
    topJobs,
    geoStats,
    userGrowth,
    jobGrowth,
  ] = await Promise.all([
    getVisitStats(30),
    getApplicationConversionStats(30),
    getTopJobs(10),
    getGeoStats(),
    getUserGrowthStats(30),
    getJobGrowthStats(30),
  ]);

  return {
    visitStats,
    conversionStats,
    topJobs,
    geoStats,
    userGrowth,
    jobGrowth,
  };
}

export async function getGeoStats() {
  const countryData = await prisma.$queryRaw<
    Array<{ country: string; pv: bigint; uv: bigint; city: string }>
  >`
    SELECT country, 
           COUNT(*) as pv,
           COUNT(DISTINCT "sessionId") as uv,
           MODE() WITHIN GROUP (ORDER BY city) as city
    FROM page_views
    WHERE country IS NOT NULL AND country != ''
    GROUP BY country
    ORDER BY pv DESC
    LIMIT 20
  `;

  // 国家名称映射
  const COUNTRY_NAMES: Record<string, string> = {
    'CN': '🇨🇳 中国', 'US': '🇺🇸 美国', 'HK': '🇭🇰 香港',
    'JP': '🇯🇵 日本', 'KR': '🇰🇷 韩国', 'TH': '🇹🇭 泰国',
    'TW': '🇹🇼 台湾', 'PL': '🇵🇱 波兰', 'VN': '🇻🇳 越南',
    'NL': '🇳🇱 荷兰', 'GB': '🇬🇧 英国', 'CA': '🇨🇦 加拿大',
    'IN': '🇮🇳 印度', 'MX': '🇲🇽 墨西哥', 'SG': '🇸🇬 新加坡',
    'AU': '🇦🇺 澳大利亚', 'DE': '🇩🇪 德国', 'FR': '🇫🇷 法国',
    'BR': '🇧🇷 巴西', 'RU': '🇷🇺 俄罗斯', 'MY': '🇲🇾 马来西亚',
    'ID': '🇮🇩 印度尼西亚', 'PH': '🇵🇭 菲律宾',
  };

  return countryData.map(d => ({
    code: d.country,
    name: COUNTRY_NAMES[d.country] || d.country,
    pv: Number(d.pv),
    uv: Number(d.uv),
  })).filter(d => d.pv > 0);
}
