"use client"
import { useLocale } from "next-intl";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HeartButton } from "@/components/heart-button";
import { formatDistanceToNow, formatSalary } from "@/lib/utils";

interface FavoriteWithJob {
  id: string;
  createdAt: string;
  jobs: {
    id: string;
    slug: string;
    title: string;
    salaryMin: number | null;
    salaryMax: number | null;
    location: string;
    employmentType: string;
    isRemote: boolean;
    datePosted: string;
    companies: {
      id: string;
      name: string;
      logo: string | null;
    };
  };
}

export default function FavoritesPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const isAuthenticated = status === "authenticated";

  // 未登录重定向
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login?callbackUrl=/dashboard/favorites`);
    }
  }, [status, router]);

  // 获取收藏列表
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/favorites?page=${page}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites);
          setTotalPages(data.totalPages);
          setTotal(data.total);
        }
      } catch (error) {
        console.error("获取收藏列表失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, page]);

  const handleFavoriteToggle = (jobId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      // 取消收藏后从列表中移除
      setFavorites((prev) => prev.filter((f) => f.jobs.id !== jobId));
      setTotal((prev) => prev - 1);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
              <p className="text-gray-500">共 {total} 个收藏职位</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-200"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无收藏职位
            </h3>
            <p className="text-gray-500 mb-6">
              浏览职位并点击心形图标，将感兴趣的职位添加到收藏夹
            </p>
            <Link
              href={`/${locale}/jobs`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              浏览职位
            </Link>
          </div>
        ) : (
          // Favorites list
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <FavoriteJobCard
                key={favorite.id}
                favorite={favorite}
                onToggle={handleFavoriteToggle}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 收藏职位卡片组件
function FavoriteJobCard({
  favorite,
  onToggle,
}: {
  favorite: FavoriteWithJob;
  onToggle: (jobId: string, isFavorited: boolean) => void;
}) {
  const { jobs: job } = favorite;
  const typeMap: Record<string, string> = { FULL_TIME: "全职", PART_TIME: "兼职", CONTRACT: "合同", INTERNSHIP: "实习", FREELANCE: "自由职业" };
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const timeAgo = formatDistanceToNow(new Date(job.datePosted));

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <Link href={`/jobs/${job.slug}`} className="flex-shrink-0">
          {job.companies.logo ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
              <Image
                src={job.companies.logo}
                alt={`${job.companies.name} 公司Logo`}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {job.companies.name.charAt(0)}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link href={`/jobs/${job.slug}`}>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
              </Link>
              <p className="text-gray-600">{job.companies.name}</p>
            </div>
            <span className="text-lg font-bold text-blue-600 flex-shrink-0">
              {salaryText}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg">
              📍 {job.location}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg">
              💼 {typeMap[job.employmentType] || job.employmentType}
            </span>
            {job.isRemote && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-lg">
                🏠 远程办公
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>⏱️ {timeAgo}</span>
              <span>❤️ 收藏于 {new Date(favorite.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
            <div className="flex items-center gap-3">
              <HeartButton
                jobId={job.id}
                initialFavorited={true}
                size="sm"
                onToggle={(isFav) => onToggle(job.id, isFav)}
              />
              <Link
                href={`/jobs/${job.slug}`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                申请职位
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
