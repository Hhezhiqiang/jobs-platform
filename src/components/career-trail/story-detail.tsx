"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Building2, MapPin, Users, ExternalLink, Send, CheckCircle, Clock } from "lucide-react";

interface StoryDetailProps {
  story: {
    id: string;
    title: string;
    content: string;
    type: string;
    viewCount: number;
    resonanceCount: number;
    invitationStatus?: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    company?: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
      description?: string | null;
      location?: string | null;
      industry?: string | null;
      size?: string | null;
      website?: string | null;
      _count?: {
        jobs: number;
      };
    } | null;
  };
  locale: string;
  isAuthor: boolean;
  viewCount: number;
  typeLabel: string;
  canInvite?: boolean;
}

const typeIcons: Record<string, string> = {
  EXPERIENCE: "💡",
  TRANSITION: "🔄",
  MILESTONE: "🏆",
  CHALLENGE: "💪",
  INSIGHT: "🔍",
};

export function StoryDetail({ 
  story, 
  locale, 
  isAuthor, 
  viewCount, 
  typeLabel,
  canInvite = false 
}: StoryDetailProps) {
  const typeIcon = typeIcons[story.type] || "📝";
  const hasCompany = !!story.company;
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // 发送内推邀请
  const handleInvite = async () => {
    if (!canInvite || !story.company) return;
    
    setIsInviting(true);
    setInviteError("");
    
    try {
      const response = await fetch(`/api/stories/${story.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `您好！我是 ${story.company.name} 的HR，看到您分享的职业故事，觉得您的经历与我们的团队非常契合。诚邀您考虑加入我们的团队！`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInviteSuccess(true);
      } else {
        setInviteError(data.error || "发送邀请失败");
      }
    } catch (err) {
      setInviteError("网络错误，请重试");
    } finally {
      setIsInviting(false);
    }
  };

  // 获取邀请状态显示
  const getInvitationStatus = () => {
    if (!story.invitationStatus) return null;
    
    switch (story.invitationStatus) {
      case "pending":
        return (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>内推邀请待处理</span>
          </div>
        );
      case "accepted":
        return (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>已接受内推邀请</span>
          </div>
        );
      case "declined":
        return (
          <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
            <span>已婉拒内推邀请</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Type */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
          {typeIcon} {typeLabel}
        </span>
        {isAuthor && (
          <Link
            href={`/${locale}/career-trail/${story.id}/edit`}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            编辑
          </Link>
        )}
        {getInvitationStatus()}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h1>

      {/* Author Info */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        {story.author.avatar ? (
          <Image
            src={story.author.avatar}
            alt={story.author.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {story.author.name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900">{story.author.name}</div>
          <div className="text-sm text-gray-500">
            {new Date(story.createdAt).toLocaleDateString("zh-CN")}
            {story.createdAt.toISOString() !== story.updatedAt.toISOString() && " · 已编辑"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8 whitespace-pre-wrap">
        {story.content}
      </div>

      {/* 公司卡片（如果故事@了公司） */}
      {hasCompany && story.company && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            {story.company.logo ? (
              <Image
                src={story.company.logo}
                alt={story.company.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  @{story.company.name}
                </h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  正在招人
                </span>
              </div>
              
              {story.company.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {story.company.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                {story.company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {story.company.location}
                  </span>
                )}
                {story.company.industry && (
                  <span>{story.company.industry}</span>
                )}
                {story.company.size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {story.company.size}
                  </span>
                )}
                {story.company._count && story.company._count.jobs > 0 && (
                  <span className="text-blue-600 font-medium">
                    {story.company._count.jobs} 个开放职位
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/companies/${story.company.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看公司
                </Link>
                
                {story.company._count && story.company._count.jobs > 0 && (
                  <Link
                    href={`/${locale}/jobs?company=${story.company.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    查看职位
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* HR视角：发送内推邀请按钮 */}
          {canInvite && !inviteSuccess && story.invitationStatus !== "pending" && story.invitationStatus !== "accepted" && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              {inviteError && (
                <p className="text-red-600 text-sm mb-2">{inviteError}</p>
              )}
              <button
                onClick={handleInvite}
                disabled={isInviting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {isInviting ? "发送中..." : "向作者发送内推邀请"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                邀请作者投递贵公司的职位
              </p>
            </div>
          )}
          
          {inviteSuccess && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">内推邀请已发送！</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pt-6 border-t border-gray-200">
        <span>👁 {viewCount} 浏览</span>
        <span>💙 {story.resonanceCount} 共鸣</span>
        <span>{new Date(story.createdAt).toLocaleDateString("zh-CN")}</span>
      </div>
    </article>
  );
}
