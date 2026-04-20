"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Users, Plus } from "lucide-react";

// 模拟推荐用户数据
const recommendedUsers = [
  {
    id: "u3",
    name: "王大力",
    title: "资深程序员",
    avatar: null,
    storyCount: 23,
    followerCount: 1245,
  },
  {
    id: "u7",
    name: "孙建国",
    title: "产品经理",
    avatar: null,
    storyCount: 18,
    followerCount: 892,
  },
  {
    id: "u2",
    name: "李思远",
    title: "算法工程师",
    avatar: null,
    storyCount: 15,
    followerCount: 756,
  },
  {
    id: "u10",
    name: "郑雅琪",
    title: "HRBP",
    avatar: null,
    storyCount: 31,
    followerCount: 2103,
  },
];

export function RecommendedUsers() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" />
        推荐作者
      </h3>
      <div className="space-y-4">
        {recommendedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Link href={`/user/${user.id}`} className="flex-shrink-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/user/${user.id}`}
                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {user.name}
              </Link>
              <p className="text-xs text-gray-500">{user.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.storyCount} 篇故事 · {user.followerCount} 关注者
              </p>
            </div>
            <button className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Link
        href={`/${locale}/career-trail/users`}
        className="block mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        查看更多作者 →
      </Link>
    </div>
  );
}
