import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateJobsListMetadata } from "@/lib/metadata";
import { JobCard } from "@/components/job-card";
import { Metadata } from "next";

interface PageProps {
  searchParams: Promise<{
    city?: string;
    type?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateJobsListMetadata({
    city: params.city,
    type: params.type,
  });
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    status: "ACTIVE",
    ...(params.city && { city: params.city }),
    ...(params.type && { employmentType: params.type }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: true },
      orderBy: { datePosted: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600 mb-6">
          共找到 {total} 个职位
        </p>

        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/jobs?page=${page - 1}`}
                className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
              >
                上一页
              </Link>
            )}
            <span className="px-4 py-2">{page} / {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/jobs?page=${page + 1}`}
                className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
              >
                下一页
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
