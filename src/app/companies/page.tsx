import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "公司列表 - 招聘平台",
  description: "发现优秀企业，查看最新招聘信息",
};

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold">公司列表</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-600 mb-6">共 {companies.length} 家公司</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {company.logo && (
                  <Image
                    src={company.logo}
                    alt={`${company.name} Logo`}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{company.industry}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>{company.size}</span>
                    <span>·</span>
                    <span>{company._count.jobs} 个职位</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {company.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无公司数据</p>
          </div>
        )}
      </main>
    </div>
  );
}
