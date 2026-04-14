"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Eye } from "lucide-react";

interface HotBlog {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  featuredImage: string | null;
}

export function HotBlogsSidebar() {
  const [hotBlogs, setHotBlogs] = useState<HotBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotBlogs() {
      try {
        const res = await fetch("/api/blog/hot?limit=5");
        if (res.ok) {
          const data = await res.json();
          setHotBlogs(data.blogs || []);
        }
      } catch (error) {
        console.error("Failed to fetch hot blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHotBlogs();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          热门文章
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hotBlogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-red-500" />
        热门文章
      </h3>
      <div className="space-y-4">
        {hotBlogs.map((blog, index) => (
          <Link
            key={blog.id}
            href={`/blog/${blog.slug}`}
            className="flex gap-3 group hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
              {blog.featuredImage ? (
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {blog.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                <span>{blog.viewCount} 阅读</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
