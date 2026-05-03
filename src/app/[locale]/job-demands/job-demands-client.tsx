"use client";

import { useState } from "react";
import { Search, Briefcase, MapPin, DollarSign, Plus, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";

interface JobDemand {
  id: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  tags: string[];
  bio: string | null;
  createdAt: string;
  user: { name: string; avatar: string | null };
}

interface JobDemandsClientProps {
  initialDemands: JobDemand[];
  locale: string;
}

export default function JobDemandsClient({ initialDemands, locale }: JobDemandsClientProps) {
  const isEn = locale === "en";
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isEn ? "Talent Pool" : "求职需求广场"}
              </h1>
              <p className="text-[#c7d2fe]/80 text-lg">
                {isEn ? "Discover top talents looking for opportunities." : "发现正在寻找机会的优秀人才。"}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl font-semibold transition-all"
            >
              <Plus className="w-5 h-5" />
              {isEn ? "Post Demand" : "发布需求"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {initialDemands.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {isEn ? "No demands posted yet. Be the first!" : "暂无求职需求，快来发布你的意向吧！"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialDemands.map((demand) => (
              <div key={demand.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{demand.title}</h3>
                  {demand.user && (
                    <span className="text-xs text-gray-400">
                      {demand.user.name}
                    </span>
                  )}
                </div>
                
                {demand.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{demand.bio}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {demand.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">
                      <MapPin className="w-3 h-3" />
                      {demand.location}
                    </span>
                  )}
                  {demand.salaryMin && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ecfdf5] text-[#059669] text-xs rounded-lg">
                      <DollarSign className="w-3 h-3" />
                      {demand.salaryMin}{demand.salaryMax ? `-${demand.salaryMax}` : ""}{demand.currency}
                    </span>
                  )}
                  {demand.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-[#eef2ff] text-[#4f46e5] text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Post Modal */}
      {isModalOpen && (
        <PostDemandModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

function PostDemandModal({ onClose }: { onClose: () => void }) {
  const isEn = false; // Assuming zh for now
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    salaryMin: "",
    salaryMax: "",
    location: "",
    tags: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/job-demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
          location: formData.location,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
          bio: formData.bio,
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("发布失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">发布求职需求</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">求职意向 *</label>
            <input
              required
              type="text"
              placeholder="例如：高级前端开发求职"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望最低薪资</label>
              <input
                type="number"
                placeholder="20"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望最高薪资</label>
              <input
                type="number"
                placeholder="30"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期望地点</label>
            <input
              type="text"
              placeholder="例如：北京、上海、Remote"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">个人优势/介绍</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6366f1] text-white rounded-xl font-semibold hover:bg-[#4f46e5] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "发布中..." : "立即发布"}
          </button>
        </form>
      </div>
    </div>
  );
}
