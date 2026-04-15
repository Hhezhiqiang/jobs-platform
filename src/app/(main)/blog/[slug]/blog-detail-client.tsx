"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  CalendarDays, 
  Eye, 
  Clock, 
  User, 
  ChevronLeft,
  Bookmark,
  ThumbsUp,
} from "lucide-react";
import { RelatedJobs } from "@/components/related-jobs";
import { ShareButtons } from "@/components/share-buttons";
import { BlogContent } from "@/components/blog-content";
import { useTableOfContents } from "@/components/table-of-contents";
import { ConversionTools } from "@/components/conversion-tools";
import { EmailSubscription } from "@/components/email-subscription";

interface BlogPost {
  id: string;
  title: string;
  titleEn?: string | null;
  content: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  keywords?: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

interface BlogDetailClientProps {
  post: BlogPost;
  locale: string;
}

export function BlogDetailClient({ post, locale }: BlogDetailClientProps) {
  const [readingTime, setReadingTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const { headings, activeId } = useTableOfContents(post.content);

  // 计算阅读时间
  useEffect(() => {
    const wordCount = post.content.replace(/\s/g, "").length;
    setReadingTime(Math.ceil(wordCount / 300));
  }, [post.content]);

  // 滚动进度
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 检查是否已收藏
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem("blogBookmarks") || "[]");
    setIsBookmarked(bookmarks.includes(post.id));
  }, [post.id]);

  // 收藏功能
  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("blogBookmarks") || "[]");
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== post.id);
    } else {
      newBookmarks = [...bookmarks, post.id];
    }
    localStorage.setItem("blogBookmarks", JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  // 点赞功能
  const handleLike = () => {
    const liked = JSON.parse(localStorage.getItem("blogLikes") || "[]");
    if (!liked.includes(post.id)) {
      liked.push(post.id);
      localStorage.setItem("blogLikes", JSON.stringify(liked));
      setHasLiked(true);
    }
  };

  return (
    <>
      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="min-h-screen bg-white">
        {/* 头部大图 */}
        <div className="relative h-[400px] lg:h-[500px]">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                返回博客列表
              </Link>

              <h1 className="text-2xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>

              {post.keywords && post.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 主内容 */}
            <div className="flex-1 lg:max-w-3xl">
              {/* 元信息栏 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>JobsBro编辑</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime}分钟阅读</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.viewCount + 1} 阅读</span>
                </div>
              </div>

              {/* 分享和收藏 */}
              <div className="flex items-center justify-between mb-8">
                <ShareButtons 
                  title={post.title} 
                  url={currentUrl} 
                  description={post.excerpt || ""}
                />
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isBookmarked 
                        ? "bg-yellow-100 text-yellow-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "已收藏" : "收藏"}
                  </button>
                </div>
              </div>

              {/* 摘要 */}
              {post.excerpt && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
                  <p className="text-gray-700 italic">{post.excerpt}</p>
                </div>
              )}

              {/* 正文内容 */}
              <BlogContent content={post.content} />

              {/* 底部互动区 */}
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleLike}
                    disabled={hasLiked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      hasLiked 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
                    {hasLiked ? "已点赞" : "有用"}
                  </button>
                  
                  <ShareButtons 
                    title={post.title} 
                    url={currentUrl}
                    description={post.excerpt || ""}
                  />
                </div>
              </div>

              {/* 转化组件：相关职位 */}
              <RelatedJobs 
                keywords={post.keywords} 
                currentSlug={post.slug}
                limit={3}
              />

              {/* 转化组件：求职工具 */}
              <ConversionTools blogKeywords={post.keywords} />
            </div>

            {/* 侧边栏 */}
            <aside className="lg:w-72 space-y-6">
              {headings.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">目录</h3>
                  <nav className="space-y-2">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm hover:text-blue-600 transition-colors ${
                          heading.level === 1 ? "font-medium" : ""
                        } ${
                          activeId === heading.id
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
                        }`}
                        style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
              <EmailSubscription />
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
