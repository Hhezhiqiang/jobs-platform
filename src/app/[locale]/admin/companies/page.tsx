"use client";

import type { companies } from "@prisma/client";
import { useState, useCallback } from "react";
import {
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
} from "lucide-react";

type Company = companies;

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待审核" },
  { value: "APPROVED", label: "已通过" },
  { value: "REJECTED", label: "已拒绝" },
  { value: "SUSPENDED", label: "已暂停" },
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const query = params.toString();
      const res = await fetch(`/api/admin/companies${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setCompanies(data.companies);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "获取企业列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const handleReview = async (status: "APPROVED" | "REJECTED" | "SUSPENDED") => {
    if (!selectedCompany) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setShowReviewModal(false);
      setSelectedCompany(null);
      setRejectionReason("");
      fetchCompanies();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { text: "已通过", className: "bg-green-100 text-green-800" },
      REJECTED: { text: "已拒绝", className: "bg-red-100 text-red-800" },
      SUSPENDED: { text: "已暂停", className: "bg-gray-100 text-gray-800" },
    };
    const info = statusMap[status] || { text: status, className: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.className}`}>
        {info.text}
      </span>
    );
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.creditCode?.includes(searchQuery) ||
      company.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="w-6 h-6" />
              <h1 className="text-xl font-bold">企业管理</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索企业名称、信用代码、邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-sm text-gray-500">
                共 {filteredCompanies.length} 家企业
              </span>
            </div>
          </div>
        </div>

        {/* 企业列表 */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              没有找到符合条件的企业
            </div>
          ) : (
            <div className="divide-y">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        {getStatusBadge(company.verificationStatus)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="text-gray-400">统一信用代码：</span>
                          <span>{company.creditCode || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">联系人：</span>
                          <span>{company.legalPersonName || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">电话：</span>
                          <span>{company.contactPhone || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">邮箱：</span>
                          <span>{company.contactEmail || "-"}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        提交时间：
                        {new Date(company.createdAt).toLocaleString("zh-CN")}
                      </div>

                      {company.rejectionReason && (
                        <p className="mt-2 text-sm text-red-600">
                          拒绝原因：{company.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowReviewModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="审核"
                      >
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>

                      {company.verificationStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              handleReview("APPROVED");
                            }}
                            className="p-2 hover:bg-green-100 rounded-lg"
                            title="通过"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowReviewModal(true);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg"
                            title="拒绝"
                          >
                            <XCircle className="w-5 h-5 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 审核弹窗 */}
      {showReviewModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">企业审核</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedCompany(null);
                    setRejectionReason("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">公司名称</label>
                    <p className="font-medium">{selectedCompany.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">企业标识</label>
                    <p className="font-medium">{selectedCompany.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">统一信用代码</label>
                    <p className="font-medium">{selectedCompany.creditCode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">法人姓名</label>
                    <p className="font-medium">{selectedCompany.legalPersonName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">联系电话</label>
                    <p className="font-medium">{selectedCompany.contactPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">联系邮箱</label>
                    <p className="font-medium">{selectedCompany.contactEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">行业</label>
                    <p className="font-medium">{selectedCompany.industry || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">规模</label>
                    <p className="font-medium">{selectedCompany.size || "-"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">公司简介</label>
                  <p className="mt-1 text-gray-700">
                    {selectedCompany.description || "暂无简介"}
                  </p>
                </div>

                {selectedCompany.businessLicense && (
                  <div>
                    <label className="text-sm text-gray-500">营业执照</label>
                    <a
                      href={selectedCompany.businessLicense}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-600 hover:underline"
                    >
                      查看营业执照
                    </a>
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="text-sm text-gray-500">拒绝原因（如拒绝）</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="如果拒绝申请，请填写拒绝原因..."
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedCompany(null);
                      setRejectionReason("");
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleReview("REJECTED")}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleReview("APPROVED")}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    通过审核
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}