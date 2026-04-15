"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface Story {
  id: string;
  title: string;
  content: string;
  type: string;
  resonanceCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface RelatedStoriesProps {
  stories: Story[];
  currentStoryId: string;
}

// Story type map for display
const storyTypeMap: Record<string, { label: string; color: string; bgColor: string }> = {
  EXPERIENCE: { label: "经验分享", color: "text-blue-600", bgColor: "bg-blue-100" },
  TRANSITION: { label: "职业转型", color: "text-purple-600", bgColor: "bg-purple-100" },
  MILESTONE: { label: "职业里程碑", color: "text-green-600", bgColor: "bg-green-100" },
  CHALLENGE: { label: "挑战与成长", color: "text-orange-600", bgColor: "bg-orange-100" },
  INSIGHT: { label: "行业洞察", color: "text-cyan-600", bgColor: "bg-cyan-100" },
};

export function RelatedStories({ stories, currentStoryId }: RelatedStoriesProps) {
  const filteredStories = stories.filter((s) => s.id !== currentStoryId).slice(0, 3);

  if (filteredStories.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          推荐阅读
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredStories.map((story) => {
          const typeInfo = storyTypeMap[story.type] || storyTypeMap.EXPERIENCE;

          return (
            <Link
              key={story.id}
              href={`/career-trail/${story.id}`}
              className="block p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Author Avatar */}
                {story.author.avatar ? (
                  <Image
                    src={story.author.avatar}
                    alt={story.author.name || "匿名作者"}
                    width={44}
                    height={44}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {story.author.name?.[0] || "A"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {story.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {story.content.slice(0, 100)}...
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded ${typeInfo.bgColor} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span>{story.author.name || "匿名作者"}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(story.createdAt))}</span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Heart className="w-3 h-3" />
                      {story.resonanceCount}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <Link
          href="/career-trail"
          className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          查看更多职场故事
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
