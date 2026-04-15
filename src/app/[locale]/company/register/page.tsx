"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    creditCode: "",
    legalPersonName: "",
    contactPhone: "",
    contactEmail: "",
    businessLicense: "",
  });

  // 检查 slug 可用性
  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) return;
    const res = await fetch(`/api/companies/check-slug?slug=${slug}`);
    const data = await res.json();
    setSlugAvailable(!data.exists);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "注册失败");
      }

      router.push("/company/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-xl px-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm h-16 animate-pulse" />
          <div className="bg-white rounded-xl shadow-sm h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-gray-600 mb-4">注册企业账号需要先登录</p>
          <Link
            href="/auth/login?callbackUrl=/company/register"
            className="text-blue-600 hover:underline"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">企业注册</h1>
          <p className="mt-2 text-gray-600">
            填写企业信息，提交后等待管理员审核
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入公司全称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业标识 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setFormData({ ...formData, slug: value });
                    checkSlug(value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="company-name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  用于URL显示，只能包含小写字母、数字和连字符
                </p>
                {slugAvailable === true && (
                  <p className="mt-1 text-xs text-green-600">✓ 可用</p>
                )}
                {slugAvailable === false && (
                  <p className="mt-1 text-xs text-red-600">✗ 已被使用</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请简要介绍您的公司"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  行业
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择行业</option>
                  <option value="互联网">互联网</option>
                  <option value="金融">金融</option>
                  <option value="教育">教育</option>
                  <option value="医疗">医疗</option>
                  <option value="制造">制造</option>
                  <option value="零售">零售</option>
                  <option value="房地产">房地产</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司规模
                </label>
                <select
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择规模</option>
                  <option value="1-50人">1-50人</option>
                  <option value="51-200人">51-200人</option>
                  <option value="201-500人">201-500人</option>
                  <option value="501-2000人">501-2000人</option>
                  <option value="2000人以上">2000人以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司官网
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所在地
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：北京市朝阳区"
                />
              </div>
            </div>
          </div>

          {/* 认证信息 */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">认证信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  统一社会信用代码 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.creditCode}
                  onChange={(e) =>
                    setFormData({ ...formData, creditCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="9123xxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  法人姓名
                </label>
                <input
                  type="text"
                  value={formData.legalPersonName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalPersonName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入法人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="138xxxx xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系邮箱 *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="hr@company.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营业执照
                </label>
                <input
                  type="url"
                  value={formData.businessLicense}
                  onChange={(e) =>
                    setFormData({ ...formData, businessLicense: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="营业执照图片URL"
                />
                <p className="mt-1 text-xs text-gray-500">
                  请上传营业执照扫描件或照片，支持 jpg、png 格式
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "提交中..." : "提交注册"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}