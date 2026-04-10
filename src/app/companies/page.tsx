import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Metadata } from "next";
import { Building2, MapPin, Users, Briefcase, Search } from "lucide-react";

export const dynamic = "force-dynamic";

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
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">发现优秀企业</h1>
            <p className="text-blue-100 text-lg">
              浏览 {companies.length} 家合作企业，找到适合你的职业发展平台
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="搜索公司名称..."
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header Background */}
              <div className="h-24 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                <div className="absolute -bottom-8 left-6">
                  {company.logo ? (
                    <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden ring-4 ring-white">
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl shadow-lg bg-white flex items-center justify-center text-2xl font-bold text-blue-600 ring-4 ring-white">
                      {company.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 pb-6 px-6">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {company.name}
                </h2>

                {company.industry && (
                  <p className="text-gray-500 mt-1">{company.industry}</p>
                )}

                {company.description && (
                  <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                    {company.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                  {company.size && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {company.size}
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {company.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Briefcase className="w-4 h-4" />
                    {company._count.jobs} 个职位
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无公司数据</h3>
            <p className="text-gray-500">敬请期待更多优秀企业入驻</p>
          </div>
        )}
      </main>
    </div>
  );
}
