"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RelatedBlogsProps, BlogPost } from "./types";

export function RelatedBlogs({ currentSlug, keywords, limit = 4 }: RelatedBlogsProps) {
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedBlogs() {
      try {
        const keywordStr = keywords?.join(",") || "";
        const res = await fetch(
          `/api/blog/related?slug=${currentSlug}&keywords=${encodeURIComponent(keywordStr)}&limit=${limit}`
        );
        if (res.ok) {
          const data = await res.json();
          setRelatedBlogs(data.blogs || []);
        }
      } catch (error) {
        console.error("Failed to fetch related blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedBlogs();
  }, [currentSlug, keywords, limit]);

  if (loading) {
    return (
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">相关文章</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedBlogs.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6">相关文章推荐</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatedBlogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blog/${encodeURIComponent(blog.slug)}`}
            className="group bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-40 overflow-hidden">
              {blog.featuredImage ? (
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">JobQuip</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {blog.title}
              </h4>
              {blog.excerpt && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{blog.viewCount} 阅读</span>
                <span className="text-blue-600 group-hover:underline">阅读更多 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
