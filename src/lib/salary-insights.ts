import { prisma } from "@/lib/prisma";

interface JobSalary {
  id: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  city: string | null;
  datePosted: Date;
  company: {
    industry: string | null;
  };
}

function calculateIndustryStats(jobs: JobSalary[]) {
  const industryMap = new Map<
    string,
    { salaries: number[]; count: number }
  >();

  jobs.forEach((job) => {
    const industry = job.company?.industry || "其他";
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (!industryMap.has(industry)) {
      industryMap.set(industry, { salaries: [], count: 0 });
    }
    const data = industryMap.get(industry)!;
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(industryMap.entries())
    .map(([industry, data]) => ({
      industry,
      avgSalary: Math.round(
        data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length
      ),
      count: data.count,
      min: Math.round(Math.min(...data.salaries)),
      max: Math.round(Math.max(...data.salaries)),
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 10);
}

function calculateCityStats(jobs: JobSalary[]) {
  const cityMap = new Map<
    string,
    { salaries: number[]; count: number }
  >();

  jobs.forEach((job) => {
    const city = job.city || "未知";
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (!cityMap.has(city)) {
      cityMap.set(city, { salaries: [], count: 0 });
    }
    const data = cityMap.get(city)!;
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      avgSalary: Math.round(
        data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length
      ),
      count: data.count,
      median: Math.round(
        data.salaries.sort((a, b) => a - b)[Math.floor(data.salaries.length / 2)]
      ),
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 12);
}

function calculateTrendStats(jobs: JobSalary[]) {
  const months: { month: string; avgSalary: number; count: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: monthKey, avgSalary: 0, count: 0 });
  }

  const monthMap = new Map<
    string,
    { salaries: number[]; count: number }
  >();

  jobs.forEach((job) => {
    const posted = new Date(job.datePosted);
    const monthKey = `${posted.getFullYear()}-${String(posted.getMonth() + 1).padStart(2, "0")}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { salaries: [], count: 0 });
    }
    const avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;
    const data = monthMap.get(monthKey)!;
    data.salaries.push(avgSalary);
    data.count++;
  });

  return months.map((m) => {
    const data = monthMap.get(m.month);
    return {
      month: m.month,
      avgSalary: data
        ? Math.round(data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length)
        : 0,
      count: data ? data.count : 0,
    };
  });
}

function calculateJobTypeStats(jobs: JobSalary[]) {
  const typeMap = new Map<
    string,
    { salaries: number[]; count: number }
  >();

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
    const data = typeMap.get(type)!;
    data.salaries.push(avgSalary);
    data.count++;
  });

  return Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      avgSalary: Math.round(
        data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length
      ),
      count: data.count,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary);
}

function calculateOverview(jobs: JobSalary[]) {
  if (jobs.length === 0) {
    return {
      totalJobs: 0,
      avgSalary: 0,
      medianSalary: 0,
      salaryRange: { min: 0, max: 0 },
    };
  }

  const salaries = jobs.map(
    (j) => ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2
  );
  const sorted = [...salaries].sort((a, b) => a - b);

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

export async function getSalaryInsightsData() {
  const jobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      AND: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
    },
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
      employmentType: true,
      city: true,
      datePosted: true,
      company: { select: { industry: true } },
    },
    take: 5000,
  });

  return {
    overview: calculateOverview(jobs),
    industry: calculateIndustryStats(jobs),
    city: calculateCityStats(jobs),
    trend: calculateTrendStats(jobs),
    jobType: calculateJobTypeStats(jobs),
  };
}
