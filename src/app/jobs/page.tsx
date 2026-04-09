import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateJobsListMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { JobSearch } from "@/components/job-search";

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

  // 构建查询条件
  const where: Prisma.JobWhereInput = {
    status: "ACTIVE",
  };

  // 关键词搜索
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { company: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  // 城市筛选
  if (params.city) {
    where.city = params.city;
  }

  // 职位类型筛选
  if (params.type) {
    where.employmentType = params.type as Prisma.EnumEmploymentTypeFilter<"Job">;
  }

  // 薪资范围筛选
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

  // 获取职位列表和总数
  const [jobs, total, cities, companies] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: true },
      orderBy: { datePosted: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
    // 获取所有城市列表（用于筛选）
    prisma.job.findMany({
      where: { status: "ACTIVE" },
      select: { city: true },
      distinct: ["city"],
    }),
    // 获取所有公司列表（用于筛选）
    prisma.company.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // 构建筛选后的 URL
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 首页
            </Link>
            <h1 className="text-2xl font-bold">职位列表</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 搜索和筛选侧边栏 */}
          <div className="lg:col-span-1">
            <JobSearch
              currentParams={{
                q: params.q,
                city: params.city,
                type: params.type,
                minSalary: params.minSalary,
                maxSalary: params.maxSalary,
              }}
              cities={cities.map((c) => c.city).filter(Boolean) as string[]}
            />
          </div>

          {/* 职位列表 */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                共找到 <span className="font-semibold">{total}</span> 个职位
                {params.q && (
                  <span className="ml-2">
                    与 "<span className="font-semibold">{params.q}</span>" 相关
                  </span>
                )}
              </p>
              <Link
                href="/jobs"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                清除筛选
              </Link>
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">未找到相关职位</h3>
                  <p className="text-gray-600 mb-4">
                    尝试调整搜索关键词或筛选条件
                  </p>
                  <Link
                    href="/jobs"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    查看全部职位 →
                  </Link>
                </div>
              ) : (
                jobs.map((job) => <JobCard key={job.id} job={job} compact />)
              )}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
                  >
                    上一页
                  </Link>
                )}
                <span className="px-4 py-2">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
