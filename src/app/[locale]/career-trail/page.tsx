import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Career Stories - JobQuip" : "职迹 - JobQuip",
    description: isEn ? "Share real career experiences and growth stories" : "分享真实职业经历和成长故事",
  };
}

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CareerTrailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { page } = await searchParams;
  const isEn = locale === "en";
  const currentPage = parseInt(page || "1", 10);
  const limit = 12;

  // 查询职迹故事（从 pages 表查询 CAREER_TRAIL 类型）
  const [stories, total] = await Promise.all([
    prisma.pages.findMany({
      where: { type: 'CAREER_TRAIL', status: 'PUBLISHED' },
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.pages.count({ where: { type: 'CAREER_TRAIL', status: 'PUBLISHED' } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">
            {isEn ? "Career Stories" : "职迹"}
          </h1>
          <p className="text-xl text-blue-100">
            {isEn 
              ? "Share real career experiences and growth stories"
              : "记录职业成长，分享真实经历"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {isEn ? "No stories yet" : "暂无故事"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/${locale}/career-trail/${story.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 block"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {story.excerpt || story.content?.slice(0, 150) + '...'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {story.users?.avatar ? (
                        <img src={story.users.avatar} alt={story.users.name || ''} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                          {story.users?.name?.[0] || 'U'}
                        </div>
                      )}
                      <span>{story.users?.name || 'Anonymous'}</span>
                    </div>
                    <span>{new Date(story.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN')}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/career-trail?page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    {isEn ? "Previous" : "上一页"}
                  </Link>
                )}
                <span className="px-4 py-2 text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/career-trail?page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    {isEn ? "Next" : "下一页"}
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
