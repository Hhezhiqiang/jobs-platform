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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateJobsListMetadata({
    city: params.city,
    type: params.type,
    query: params.q,
  });
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  let jobs: any[] = [];
  let total = 0;
  let cities: { city: string | null }[] = [];
  let dbError = false;

  try {
    // 构建查询条件
    const where: Prisma.jobsWhereInput = { status: "ACTIVE" };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        { companies: { name: { contains: params.q, mode: "insensitive" } } },
      ];
    }

    if (params.city) {
      where.city = params.city;
    }

    if (params.type) {
      where.employmentType = params.type as Prisma.EnumEmploymentTypeFilter<"jobs">;
    }

    if (params.minSalary || params.maxSalary) {
      where.AND = [];
      if (params.minSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMin: { gte: parseInt(params.minSalary) },
        });
      }
      if (params.maxSalary) {
        (where.AND as Prisma.jobsWhereInput[]).push({
          salaryMax: { lte: parseInt(params.maxSalary) },
        });
      }
    }

    // 按公司文化标签筛选
    if (params.cultureTag) {
      where.companies = {
        cultureTags: {
          has: params.cultureTag,
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
    q: params.q,
    city: params.city,
    type: params.type,
    minSalary: params.minSalary,
    maxSalary: params.maxSalary,
    cultureTag: params.cultureTag,
    onlyMatched: params.onlyMatched,
    sort: params.sort,
    page: params.page,
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
