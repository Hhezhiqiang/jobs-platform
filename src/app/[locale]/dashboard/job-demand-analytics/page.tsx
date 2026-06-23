"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Pause, 
  Play,
  Crown,
  Clock,
  Calendar,
} from "lucide-react";

interface JobDemand {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  contactCount: number;
  isFeatured: boolean;
  featuredExpiresAt: string | null;
  createdAt: string;
  _count: {
    contacts: number;
  };
}

export default function JobDemandAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const { data: session } = useSession();
  const [demands, setDemands] = useState<JobDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const res = await fetch("/api/job-demands/manage");
      const result = await res.json();
      if (res.ok) {
        setDemands(result.data);
        const views = result.data.reduce((sum: number, d: JobDemand) => sum + d.viewCount, 0);
        const contacts = result.data.reduce((sum: number, d: JobDemand) => sum + d._count.contacts, 0);
        setTotalViews(views);
        setTotalContacts(contacts);
      }
    } catch {
      alert("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/job-demands/manage?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchDemands();
      }
    } catch {
      alert("操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个求职需求吗？")) return;
    try {
      const res = await fetch(`/api/job-demands/manage?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDemands();
      }
    } catch {
      alert("删除失败");
    }
  };

  const handleFeature = async (id: string, days: number) => {
    // 商业化：付费置顶
    alert(`置顶功能开发中！预计 ${days} 天，价格：¥${days * 9.9}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">求职需求数据分析</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">总浏览量</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">被联系次数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalContacts}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">活跃需求</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {demands.filter(d => d.status === "OPEN").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 需求列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">我的求职需求</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {demands.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无求职需求</p>
                <button
                  onClick={() => router.push(`/${locale}/dashboard/job-demand`)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  发布求职需求
                </button>
              </div>
            ) : (
              demands.map((demand) => (
                <div key={demand.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{demand.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          demand.status === "OPEN" ? "bg-green-100 text-green-700" :
                          demand.status === "CLOSED" ? "bg-gray-100 text-gray-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {demand.status === "OPEN" ? "求职中" :
                           demand.status === "CLOSED" ? "已关闭" : "暂停"}
                        </span>
                        {demand.isFeatured && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3" /> 置顶
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {demand.viewCount} 浏览
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> {demand._count.contacts} 联系
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {new Date(demand.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(demand.id, demand.status === "OPEN" ? "PAUSED" : "OPEN")}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title={demand.status === "OPEN" ? "暂停" : "恢复"}
                      >
                        {demand.status === "OPEN" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(demand.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleFeature(demand.id, 7)}
                        className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
                        title="置顶 7 天"
                      >
                        <Crown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
