import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateJobsListMetadata } from "@/lib/metadata";
import { FilterSidebarV2 } from "@/components/filter-sidebar-v2";
import { Breadcrumb } from "@/components/breadcrumb";
import { JobsPageClient } from "@/components/jobs-page-client";
import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const page = parseInt(sp.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  let jobs: any[] = [];
  let total = 0;
  let cities: { city: string | null }[] = [];
  let dbError = false;

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

    // 获取数据
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
              industry: true,
              size: true,
              location: true,
              cultureTags: true,
            },
          },
        },
        orderBy: { datePosted: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where }),
      prisma.jobs.findMany({
        select: { city: true },
        distinct: ["city"],
      }),
    ]);

    jobs = jobsData;
    total = totalData;
    cities = citiesData;
  } catch (error) {
    console.error("Database error:", error);
    dbError = true;
  }

  const totalPages = Math.ceil(total / limit);

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
      cities={cities.map((c) => c.city).filter(Boolean) as string[]}
      dbError={dbError}
      currentParams={currentParams}
    />
  );
}
