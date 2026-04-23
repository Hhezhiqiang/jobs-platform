"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronLeft, Eye } from "lucide-react";

type Company = {
  id: string;
  name: string;
  creditCode: string | null;
  legalPersonName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
};

export default function AdminCompaniesPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  useEffect(() => {
    fetch(`/api/admin/companies?status=${statusFilter}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/${params.locale}/auth/login/admin`);
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "获取企业列表失败");
        }
        return res.json();
      })
      .then((data) => {
        if (data) setCompanies(data.companies || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [statusFilter, params.locale, router]);

  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "PENDING", label: "待审核" },
    { value: "APPROVED", label: "已通过" },
    { value: "REJECTED", label: "已拒绝" },
    { value: "SUSPENDED", label: "已暂停" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      SUSPENDED: "bg-gray-100 text-gray-800",
    };
    const labels: Record<string, string> = {
      PENDING: "待审核",
      APPROVED: "已通过",
      REJECTED: "已拒绝",
      SUSPENDED: "已暂停",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> 返回
              </Link>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                <h1 className="text-xl font-bold">企业管理</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">共 {companies.length} 家企业</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {companies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无企业数据</div>
          ) : (
            companies.map((company) => (
              <div key={company.id} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      {statusBadge(company.verificationStatus)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div><span className="text-gray-400">统一信用代码：</span>{company.creditCode || "-"}</div>
                      <div><span className="text-gray-400">联系人：</span>{company.legalPersonName || "-"}</div>
                      <div><span className="text-gray-400">电话：</span>{company.contactPhone || "-"}</div>
                      <div><span className="text-gray-400">邮箱：</span>{company.contactEmail || "-"}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      提交时间：{new Date(company.createdAt).toLocaleString("zh-CN")}
                    </div>
                    {company.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">拒绝原因：{company.rejectionReason}</p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Eye className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
