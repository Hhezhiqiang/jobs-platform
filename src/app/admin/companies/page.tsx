import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCompaniesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 获取所有公司
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { jobs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← 返回管理首页
            </Link>
            <h1 className="text-2xl font-bold">公司管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 快捷操作 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">共 {companies.length} 家公司</p>
            </div>
            <Link
              href="/admin/companies/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              + 添加公司
            </Link>
          </div>
        </div>

        {/* 公司列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    公司
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    行业
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    规模
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    职位数
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      暂无公司，请先添加
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {company.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-gray-500">{company.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {company.industry || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {company.size || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {company._count.jobs} 个职位
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/companies/${company.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看
                          </Link>
                          <Link
                            href={`/admin/companies/edit/${company.id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            编辑
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
