import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateJobsListMetadata } from "@/lib/metadata";
import { JobCardV2 } from "@/components/job-card-v2";
import { FilterSidebar } from "@/components/filter-sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
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
    const where: Prisma.JobWhereInput = { status: "ACTIVE" };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        { company: { name: { contains: params.q, mode: "insensitive" } } },
      ];
    }

    if (params.city) {
      where.city = params.city;
    }

    if (params.type) {
      where.employmentType = params.type as Prisma.EnumEmploymentTypeFilter<"Job">;
    }

    if (params.minSalary || params.maxSalary) {
      where.AND = [];
      if (params.minSalary) {
        (where.AND as Prisma.JobWhereInput[]).push({
          salaryMin: { gte: parseInt(params.minSalary) },
        });
      }
      if (params.maxSalary) {
        (where.AND as Prisma.JobWhereInput[]).push({
          salaryMax: { lte: parseInt(params.maxSalary) },
        });
      }
    }

    const [jobsData, totalData, citiesData] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { company: true },
        orderBy: { datePosted: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
      prisma.job.findMany({
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

  const buildPageUrl = (pageNum: number) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set("q", params.q);
    if (params.city) searchParams.set("city", params.city);
    if (params.type) searchParams.set("type", params.type);
    if (params.minSalary) searchParams.set("minSalary", params.minSalary);
    if (params.maxSalary) searchParams.set("maxSalary", params.maxSalary);
    searchParams.set("page", pageNum.toString());
    return `/jobs?${searchParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-2">
            <Breadcrumb items={[{ label: "职位列表", href: "/jobs" }]} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {params.q ? `"${params.q}" 的搜索结果` : "全部职位"}
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 筛选侧边栏 */}
          <div className="lg:col-span-1">
            <FilterSidebar
              currentParams={{
                q: params.q,
                city: params.city,
                type: params.type,
                minSalary: params.minSalary,
                maxSalary: params.maxSalary,
              }}
              cities={cities.map((c) => c.city).filter(Boolean) as string[]}
              totalJobs={total}
            />
          </div>

          {/* 职位列表 */}
          <div className="lg:col-span-3">
            {dbError ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">服务暂时不可用</h3>
                <p className="text-gray-500 mb-6">数据库连接失败，请稍后重试</p>
                <a
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  重新加载
                </a>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">未找到相关职位</h3>
                <p className="text-gray-500 mb-6">尝试调整搜索关键词或筛选条件</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  查看全部职位
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    共 <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> 个职位
                  </p>
                </div>

                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCardV2 key={job.id} job={job} variant="compact" />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {page > 1 && (
                      <Link
                        href={buildPageUrl(page - 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        上一页
                      </Link>
                    )}

                    <div className="flex items-center gap-1">
                      {/* 第一页 */}
                      {page > 3 && (
                        <>
                          <Link
                            href={buildPageUrl(1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            1
                          </Link>
                          {page > 4 && <span className="px-2 text-gray-400">...</span>}
                        </>
                      )}

                      {/* 中间页码 */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Link
                            key={pageNum}
                            href={buildPageUrl(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-all ${
                              page === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}

                      {/* 最后一页 */}
                      {page < totalPages - 2 && (
                        <>
                          {page < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                          <Link
                            href={buildPageUrl(totalPages)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {totalPages}
                          </Link>
                        </>
                      )}
                    </div>

                    {page < totalPages && (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        下一页
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
