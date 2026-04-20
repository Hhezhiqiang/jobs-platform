"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  Clock, 
  Eye,
  Heart,
  Filter,
  Loader2
} from "lucide-react";

interface Story {
  id: string;
  title: string;
  content: string;
  type: string;
  viewCount: number;
  resonanceCount: number;
  invitationStatus: string | null;
  invitationSentAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
}

export default function CompanyStoriesPage() {
  const params = useParams();
  const { slug: companyId, locale } = (params || {}) as Record<string, string>;
  
  const [stories, setStories] = useState<Story[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [invitingStoryId, setInvitingStoryId] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, [companyId, statusFilter]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/companies/${companyId}/stories`, window.location.origin);
      if (statusFilter) {
        url.searchParams.set("status", statusFilter);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        setStories(data.stories);
        setCompany(data.company);
        setCanManage(data.canManage);
      } else {
        setError(data.error || "获取数据失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 发送内推邀请
  const handleInvite = async (storyId: string) => {
    if (!canManage) return;

    setInvitingStoryId(storyId);
    setInviteSuccess(null);

    try {
      const response = await fetch(`/api/stories/${storyId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `您好！我们是 ${company?.name} 的HR团队，看到您在职业故事中分享了精彩的经历，觉得您的背景与我们的团队非常匹配。诚邀您考虑加入我们的团队！`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInviteSuccess(storyId);
        // 刷新列表
        fetchStories();
      } else {
        alert(data.error || "发送邀请失败");
      }
    } catch (err) {
      alert("网络错误，请重试");
    } finally {
      setInvitingStoryId(null);
    }
  };

  // 获取状态标签
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            待处理
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            已接受
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            已婉拒
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            新故事
          </span>
        );
    }
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EXPERIENCE: "💡 经验分享",
      TRANSITION: "🔄 职业转型",
      MILESTONE: "🏆 职业里程碑",
      CHALLENGE: "💪 挑战与成长",
      INSIGHT: "🔍 行业洞察",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/${locale}/career-trail`}
            className="text-blue-600 hover:underline"
          >
            返回职迹首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/career-trail`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回职迹
          </Link>
          
          <div className="flex items-center gap-4">
            {company?.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company?.name}</h1>
              <p className="text-gray-600">@我的故事列表</p>
            </div>
          </div>
        </div>

        {!canManage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            您没有权限管理该公司的内推邀请。请联系公司管理员获取权限。
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">筛选状态：</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusFilter === ""
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              待处理
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusFilter === "accepted"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              已接受
            </button>
          </div>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无故事</h3>
            <p className="text-gray-500">
              {statusFilter 
                ? "还没有符合此状态的故事。" 
                : "还没有人@您的公司发布职业故事。"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {story.author.avatar ? (
                      <Image
                        src={story.author.avatar}
                        alt={story.author.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {story.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{story.author.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(story.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(story.invitationStatus)}
                  </div>
                </div>

                <Link href={`/${locale}/career-trail/${story.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {story.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {getTypeLabel(story.type)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    {story.viewCount}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Heart className="w-4 h-4" />
                    {story.resonanceCount}
                  </span>
                </div>

                <p className="text-gray-600 line-clamp-3 mb-4">
                  {story.content}
                </p>

                {canManage && !story.invitationStatus && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleInvite(story.id)}
                      disabled={invitingStoryId === story.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {invitingStoryId === story.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          发送中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          一键邀请投递
                        </>
                      )}
                    </button>
                    <Link
                      href={`/${locale}/career-trail/${story.id}`}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      查看详情 →
                    </Link>
                    
                    {inviteSuccess === story.id && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        邀请已发送
                      </span>
                    )}
                  </div>
                )}

                {canManage && story.invitationStatus === "pending" && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="text-amber-600 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      等待作者响应...
                    </span>
                    <Link
                      href={`/${locale}/career-trail/${story.id}`}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      查看详情 →
                    </Link>
                  </div>
                )}

                {canManage && story.invitationStatus === "accepted" && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      作者已接受邀请
                    </span>
                    <Link
                      href={`/${locale}/career-trail/${story.id}`}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      查看详情 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
