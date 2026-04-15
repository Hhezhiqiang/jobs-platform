"use client";

import Link from "next/link";
import { TrendingUp, Heart } from "lucide-react";

// 模拟热门故事数据
const hotStories = [
  {
    id: "3",
    title: "35岁程序员危机？我的一些职场顿悟",
    resonanceCount: 1567,
  },
  {
    id: "7",
    title: "工作十年后，我终于明白了职场的真相",
    resonanceCount: 2134,
  },
  {
    id: "10",
    title: "腾讯社招面试全记录：从投简历到拿offer",
    resonanceCount: 1023,
  },
  {
    id: "2",
    title: "字节跳动三面复盘：我是如何拿到60万年薪offer的",
    resonanceCount: 892,
  },
  {
    id: "9",
    title: "从传统行业跳槽互联网，我的薪资翻了3倍",
    resonanceCount: 789,
  },
];

export function HotStories() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-rose-500" />
        热门故事
      </h3>
      <div className="space-y-4">
        {hotStories.map((story, index) => (
          <Link
            key={story.id}
            href={`/career-trail/${story.id}`}
            className="group flex items-start gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
          >
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                index < 3
                  ? "bg-gradient-to-br from-rose-500 to-orange-400 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {story.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Heart className="w-3 h-3 text-pink-400" />
                <span>{story.resonanceCount} 共鸣</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
