import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "专题列表 - 发现行业机会",
  description: "浏览我们精心策划的职场专题，发现热门行业和职业机会。",
};

export default async function TopicsPage() {
  const topics = await prisma.pages.findMany({
    where: {
      type: "PAGE",
      status: "PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">专题精选</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            探索热门行业、技术栈与职业发展的深度专题内容
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">暂无专题内容，敬请期待</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[16/9] relative bg-gray-100">
                  {topic.featuredImage ? (
                    <Image
                      src={topic.featuredImage}
                      alt={topic.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <span className="text-4xl font-bold">{topic.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {topic.title}
                  </h3>
                  {topic.excerpt && (
                    <p className="text-gray-600 text-sm line-clamp-2">{topic.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
                    阅读专题
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
