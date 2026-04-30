import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateJobsListMetadata } from "@/lib/metadata";
import { JobsPageClient } from "@/components/aurora/jobs-page-client";
import { Metadata } from "next";
import { Prisma } from "@prisma/client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    city?: string;
    type?: string;
    minSalary?: string;
    maxSalary?: string;
    cultureTag?: string;
    onlyMatched?: string;
    sort?: string;
    page?: string;
  }>;
}

// ISR 缓存：30 秒后重新生成
export const revalidate = 30;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  return generateJobsListMetadata({
    city: sp.city,
    type: sp.type,
    query: sp.q,
  }, locale);
}

export default async function JobsPage({ params, searchParams }: PageProps) {
  const sp = await searchParams;

  let jobs: any[] = [];
  let total = 0;
  let cities: { city: string | null }[] = [];
  let dbError = false;
  const ITEMS_PER_PAGE = 15;
  const page = Math.max(1, parseInt(sp?.page as string || "1", 10));
  const skip = (page - 1) * ITEMS_PER_PAGE;

  try {
    // 构建查询条件
    const where: Prisma.jobsWhereInput = { status: "ACTIVE" };

    if (sp.q) {
      where.OR = [
        { title: { contains: sp.q, mode: "insensitive" } },
        { description: { contains: sp.q, mode: "insensitive" } },
        { companies: { name: { contains: sp.q, mode: "insensitive" } } },
      ];
    }

    if (sp.city) {
      where.city = sp.city;
    }

    if (sp.type) {
      where.employmentType = sp.type as Prisma.EnumEmploymentTypeFilter<"jobs">;
    }

    if (sp.minSalary || sp.maxSalary) {
      where.AND = [];
      if (sp.minSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMin: { gte: parseInt(sp.minSalary) },
        });
      }
      if (sp.maxSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMax: { lte: parseInt(sp.maxSalary) },
        });
      }
    }

    // 按公司文化标签筛选
    if (sp.cultureTag) {
      where.companies = {
        cultureTags: {
          has: sp.cultureTag,
        },
      };
    }

  // Server-side pagination

  // 获取数据（服务端分页）
  const [jobsData, totalData, citiesData] = await Promise.all([
    prisma.jobs.findMany({
      where,
      include: { 
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: { datePosted: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.jobs.count({ where }),
    prisma.jobs.findMany({
      select: { city: true },
      distinct: ["city"],
      where: { status: "ACTIVE" },
    }),
  ]);

    jobs = jobsData;
    total = totalData;
    cities = citiesData;
  } catch (error) {
    console.error("Database error:", error);
    dbError = true;
  }

  const currentParams = {
    q: sp.q,
    city: sp.city,
    type: sp.type,
    minSalary: sp.minSalary,
    maxSalary: sp.maxSalary,
    cultureTag: sp.cultureTag,
    onlyMatched: sp.onlyMatched,
    sort: sp.sort,
    page: sp.page,
  };

  return (
    <JobsPageClient
      initialJobs={jobs}
      total={total}
      totalPages={Math.ceil(total / ITEMS_PER_PAGE)}
      currentPage={page}
      cities={cities.map((c) => c.city).filter(Boolean) as string[]}
      dbError={dbError}
      currentParams={currentParams}
    />
  );
}
