"use client"
import { useLocale } from "next-intl";;

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentsSectionProps {
  storyId: string;
}

export function CommentsSection({ storyId }: CommentsSectionProps) {
  const locale = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stories/${storyId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error("获取评论失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [storyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("提交评论失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          评论 ({comments.length})
        </h2>
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "用户"}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {session?.user?.name?.[0] || "U"}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的想法..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {newComment.length}/500
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${newComment.trim() && !isSubmitting
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        发送
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 text-center">
          <p className="text-gray-500 mb-3">登录后参与讨论</p>
          <button
            onClick={() => router.push(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            登录 / 注册
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-500">加载评论中...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="p-6">
              <div className="flex gap-4">
                <Link href={`/user/${comment.author.id}`}>
                  {comment.author.image ? (
                    <Image
                      src={comment.author.image}
                      alt={comment.author.name || "匿名用户"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover hover:ring-2 ring-blue-400 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm hover:ring-2 ring-blue-400 transition-all">
                      {comment.author.name?.[0] || "A"}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/user/${comment.author.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {comment.author.name || "匿名用户"}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comment.content}</p>

                  {/* Reply button (placeholder) */}
                  <button className="mt-3 text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    回复
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无评论，来抢沙发吧！</p>
          </div>
        )}
      </div>
    </section>
  );
}
