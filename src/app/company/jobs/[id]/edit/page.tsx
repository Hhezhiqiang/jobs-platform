"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const employmentTypes = [
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];

const experienceLevels = [
  { value: "ENTRY", label: "应届生/入门级" },
  { value: "MID", label: "1-3年经验" },
  { value: "SENIOR", label: "3-5年经验" },
  { value: "EXECUTIVE", label: "5年以上/高管" },
];

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    employmentType: "FULL_TIME",
    experience: "MID",
    salaryMin: "",
    salaryMax: "",
    location: "",
    city: "",
    isRemote: false,
    isHybrid: false,
    applyUrl: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/company/jobs/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setFormData({
        title: data.job.title || "",
        description: data.job.description || "",
        requirements: data.job.requirements || "",
        benefits: data.job.benefits || "",
        employmentType: data.job.employmentType || "FULL_TIME",
        experience: data.job.experience || "MID",
        salaryMin: data.job.salaryMin?.toString() || "",
        salaryMax: data.job.salaryMax?.toString() || "",
        location: data.job.location || "",
        city: data.job.city || "",
        isRemote: data.job.isRemote || false,
        isHybrid: data.job.isHybrid || false,
        applyUrl: data.job.applyUrl || "",
        status: data.job.status || "ACTIVE",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/company/jobs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新失败");
      }

      router.push("/company/jobs");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-3xl px-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm h-12 animate-pulse" />
          <div className="bg-white rounded-xl shadow-sm h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/company/jobs")}
            className="text-blue-600 hover:underline"
          >
            返回职位列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">编辑职位</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">基本信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    职位名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作类型 *
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employmentType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    经验要求 *
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作地点 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ACTIVE">招聘中</option>
                    <option value="INACTIVE">已下架</option>
                    <option value="DRAFT">草稿</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isRemote}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRemote: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">支持远程办公</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isHybrid}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isHybrid: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">混合办公</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 薪资待遇 */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold mb-4">薪资待遇</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低薪资 (k)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMin: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最高薪资 (k)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMax: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 职位详情 */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold mb-4">职位详情</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    职位描述 *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    任职要求
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requirements: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    福利待遇
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) =>
                      setFormData({ ...formData, benefits: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    投递链接
                  </label>
                  <input
                    type="url"
                    value={formData.applyUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, applyUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-8 border-t">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "保存中..." : "保存修改"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}