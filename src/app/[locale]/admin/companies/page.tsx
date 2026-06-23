"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, Building2 } from "lucide-react";
import { DataTable, AdminBadge, AdminPagination, type Column } from "@/components/admin";

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

const statusBadgeMap: Record<string, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  PENDING: { label: "待审核", variant: "warning" },
  APPROVED: { label: "已通过", variant: "success" },
  REJECTED: { label: "已拒绝", variant: "error" },
  SUSPENDED: { label: "已暂停", variant: "default" },
};

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "待审核", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已拒绝", value: "REJECTED" },
  { label: "已暂停", value: "SUSPENDED" },
];

export default function AdminCompaniesPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("status") ?? "");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Math.max(1, parseInt(searchParams?.get("page") ?? "1", 10));

  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(currentPage));
    qs.set("limit", "20");
    if (statusFilter) qs.set("status", statusFilter);
    setLoading(true);
    fetch(`/api/admin/companies?${qs.toString()}`)
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
        if (data) {
          setCompanies(data.companies || []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [statusFilter, currentPage, params.locale, router]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    // Reset to first page on filter change
    const qs = new URLSearchParams();
    if (value) qs.set("status", value);
    router.replace(`/${params.locale}/admin/companies${qs.toString() ? `?${qs}` : ""}`);
  };

  const columns: Column<Company>[] = [
    {
      key: "name",
      label: "企业名称",
      render: (_val, row) => <span className="font-semibold text-gray-900">{row.name}</span>,
    },
    {
      key: "creditCode",
      label: "统一信用代码",
      render: (_val, row) => <span className="text-sm text-gray-500">{row.creditCode || "-"}</span>,
    },
    {
      key: "legalPersonName",
      label: "联系人",
      render: (_val, row) => <span className="text-sm text-gray-500">{row.legalPersonName || "-"}</span>,
    },
    {
      key: "contactPhone",
      label: "电话",
      render: (_val, row) => <span className="text-sm text-gray-500">{row.contactPhone || "-"}</span>,
    },
    {
      key: "contactEmail",
      label: "邮箱",
      render: (_val, row) => <span className="text-sm text-gray-500">{row.contactEmail || "-"}</span>,
    },
    {
      key: "verificationStatus",
      label: "状态",
      render: (_val, row) => {
        const s = statusBadgeMap[row.verificationStatus] || { label: row.verificationStatus, variant: "default" as const };
        return <AdminBadge variant={s.variant}>{s.label}</AdminBadge>;
      },
    },
    {
      key: "createdAt",
      label: "提交时间",
      render: (_val, row) => (
        <span className="text-xs text-gray-400">
          {new Date(row.createdAt).toLocaleString("zh-CN")}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4">
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
    <div className="space-y-6">
      {/* 标题与筛选 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业管理</h1>
          <p className="text-sm text-gray-500">共 {total} 家企业 · 第 {currentPage} / {totalPages} 页</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={companies}
        actions={(row) => [
          <Link
            key="view"
            href={`/${params.locale}/admin/companies/edit/${row.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg inline-flex items-center"
            title="查看 / 编辑"
          >
            <Eye className="w-5 h-5 text-gray-500" />
          </Link>,
          row.rejectionReason ? (
            <span key="reason" className="text-xs text-red-600 max-w-[200px] truncate" title={row.rejectionReason}>
              {row.rejectionReason}
            </span>
          ) : null,
        ]}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
            <Building2 className="w-12 h-12 text-gray-300" />
            <div className="text-base font-medium text-gray-700">暂无企业数据</div>
            <div className="text-sm">
              {statusFilter === "PENDING"
                ? "目前没有待审核的企业。新企业注册后会出现在这里。"
                : statusFilter
                ? "当前筛选条件下没有数据，试试切换状态或清空筛选。"
                : "尚未有企业入驻平台。"}
            </div>
          </div>
        }
      />

      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={`/${params.locale}/admin/companies`}
          params={{ status: statusFilter || undefined }}
        />
      )}
    </div>
  );
}
