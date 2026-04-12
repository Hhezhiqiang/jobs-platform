import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 类型定义
type JobWithCompany = Prisma.JobGetPayload<{
  include: {
    company: true;
  };
}>;

type CompanyBasic = Prisma.CompanyGetPayload<{}>;

interface SiteStats {
  jobCount: number;
  companyCount: number;
  blogCount: number;
}

interface HomePageData {
  featuredJobs: JobWithCompany[];
  latestJobs: JobWithCompany[];
  hotCompanies: CompanyBasic[];
  stats: SiteStats;
}

/**
 * 优化的数据库查询工具
 * 包含缓存策略和查询优化
 */

// 简单的内存缓存（生产环境建议使用 Redis）
const cache = new Map<string, { data: unknown; expiry: number }>();

const CACHE_TTL = {
  SHORT: 60 * 1000,      // 1分钟
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 30 * 60 * 1000,  // 30分钟
};

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
}

// 清除缓存
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * 获取热门职位（带缓存）
 */
export async function getFeaturedJobs(limit = 6): Promise<JobWithCompany[]> {
  const cacheKey = `featured_jobs_${limit}`;
  const cached = getCached<JobWithCompany[]>(cacheKey);
  if (cached) return cached;

  const jobs = await prisma.job.findMany({
    where: { 
      status: "ACTIVE", 
      isFeatured: true 
    },
    include: { 
      company: true,
    },
    orderBy: { datePosted: "desc" },
    take: limit,
  });

  setCache(cacheKey, jobs, CACHE_TTL.MEDIUM);
  return jobs;
}

/**
 * 获取最新职位（带缓存）
 */
export async function getLatestJobs(limit = 10): Promise<JobWithCompany[]> {
  const cacheKey = `latest_jobs_${limit}`;
  const cached = getCached<JobWithCompany[]>(cacheKey);
  if (cached) return cached;

  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: { 
      company: true,
    },
    orderBy: { datePosted: "desc" },
    take: limit,
  });

  setCache(cacheKey, jobs, CACHE_TTL.SHORT);
  return jobs;
}

/**
 * 获取职位详情（带缓存）
 */
export async function getJobBySlug(slug: string) {
  const cacheKey = `job_${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const job = await prisma.job.findUnique({
    where: { slug },
    include: { 
      company: true,
      applications: {
        select: { id: true },
      },
    },
  });

  if (job) {
    setCache(cacheKey, job, CACHE_TTL.MEDIUM);
  }
  return job;
}

/**
 * 获取公司列表（带缓存）
 */
export async function getCompanies(limit = 20): Promise<CompanyBasic[]> {
  const cacheKey = `companies_${limit}`;
  const cached = getCached<CompanyBasic[]>(cacheKey);
  if (cached) return cached;

  const companies = await prisma.company.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  setCache(cacheKey, companies, CACHE_TTL.LONG);
  return companies;
}

/**
 * 获取公司详情（带缓存）
 */
export async function getCompanyBySlug(slug: string) {
  const cacheKey = `company_${slug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { status: "ACTIVE" },
        orderBy: { datePosted: "desc" },
      },
    },
  });

  if (company) {
    setCache(cacheKey, company, CACHE_TTL.MEDIUM);
  }
  return company;
}

/**
 * 获取博客文章列表（带缓存）
 */
export async function getPublishedBlogs(limit = 10) {
  const cacheKey = `blogs_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const blogs = await prisma.page.findMany({
    where: { 
      type: "BLOG", 
      status: "PUBLISHED" 
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  setCache(cacheKey, blogs, CACHE_TTL.MEDIUM);
  return blogs;
}

/**
 * 获取统计数据（带缓存）
 */
export async function getSiteStats(): Promise<SiteStats> {
  const cacheKey = "site_stats";
  const cached = getCached<SiteStats>(cacheKey);
  if (cached) return cached;

  const [jobCount, companyCount, blogCount] = await Promise.all([
    prisma.job.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
    prisma.page.count({ where: { type: "BLOG", status: "PUBLISHED" } }),
  ]);

  const stats = { jobCount, companyCount, blogCount };
  setCache(cacheKey, stats, CACHE_TTL.SHORT);
  return stats;
}

/**
 * 搜索职位（不使用缓存，因为查询条件多变）
 */
export async function searchJobs(params: {
  query?: string;
  city?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const { query: rawQuery, city: rawCity, type, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  // 防止超长输入导致慢查询/恶意攻击
  const query = rawQuery ? rawQuery.slice(0, 50) : undefined;
  const city = rawCity ? rawCity.slice(0, 30) : undefined;

  const where: Prisma.JobWhereInput = { status: "ACTIVE" };

  const orConditions: Prisma.JobWhereInput[] = [];

  if (query) {
    orConditions.push(
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }
    );
  }

  if (city) {
    orConditions.push(
      { city: { contains: city, mode: "insensitive" } },
      { location: { contains: city, mode: "insensitive" } }
    );
  }

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  if (type) {
    where.employmentType = type as
      | "FULL_TIME"
      | "PART_TIME"
      | "CONTRACT"
      | "INTERNSHIP"
      | "FREELANCE";
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: { datePosted: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 批量获取（减少数据库往返）
 */
export async function getHomePageData(): Promise<HomePageData> {
  const cacheKey = "homepage_data";
  const cached = getCached<HomePageData>(cacheKey);
  if (cached) return cached;

  const [featuredJobs, latestJobs, hotCompanies, stats] = await Promise.all([
    getFeaturedJobs(6),
    getLatestJobs(10),
    getCompanies(7),
    getSiteStats(),
  ]);

  const data = {
    featuredJobs,
    latestJobs,
    hotCompanies,
    stats,
  };

  setCache(cacheKey, data, CACHE_TTL.SHORT);
  return data;
}
