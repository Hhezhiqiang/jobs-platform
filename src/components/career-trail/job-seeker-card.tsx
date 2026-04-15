"use client";

import { useState } from "react";
import Image from "next/image";
import { RecommendJobModal } from "./recommend-job-modal";

interface JobSeeker {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  status: "OPEN" | "PASSIVE";
  bio: string | null;
  expectTags: string[];
  lastActiveAt: string;
}

interface JobSeekerCardProps {
  seeker: JobSeeker;
}

// 求职状态标签颜色
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "bg-green-50", text: "text-green-700", label: "积极求职" },
  PASSIVE: { bg: "bg-yellow-50", text: "text-yellow-700", label: "看看机会" },
};

// 格式化时间
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function JobSeekerCard({ seeker }: JobSeekerCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusConfig = statusColors[seeker.status];

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {seeker.user.avatar ? (
              <Image
                src={seeker.user.avatar}
                alt={seeker.user.name}
                fill
                className="object-cover"
              />
            ) : (
              seeker.user.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">
                {seeker.user.name}
              </span>
              <span className={`px-2 py-0.5 ${statusConfig.bg} ${statusConfig.text} rounded-full text-xs font-medium`}>
                {statusConfig.label}
              </span>
            </div>
            {seeker.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {seeker.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {seeker.expectTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {seeker.expectTags.length > 3 && (
                <span className="px-2 py-0.5 text-gray-400 text-xs">
                  +{seeker.expectTags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {formatTime(seeker.lastActiveAt)}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            推荐机会
          </button>
        </div>
      </div>

      <RecommendJobModal
        seekerId={seeker.user.id}
        seekerName={seeker.user.name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
