"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Share2, Bookmark, Check } from "lucide-react";

interface StoryInteractionProps {
  storyId: string;
  initialResonanceCount: number;
  title: string;
}

export function StoryInteraction({ storyId, initialResonanceCount, title }: StoryInteractionProps) {
  const [resonanceCount, setResonanceCount] = useState(initialResonanceCount);
  const [hasResonated, setHasResonated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  // Check if user has already resonated
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkResonanceStatus = async () => {
      try {
        const response = await fetch(`/api/stories/${storyId}/resonance/check`);
        if (response.ok) {
          const data = await response.json();
          setHasResonated(data.hasResonated);
        }
      } catch (error) {
        console.error("检查共鸣状态失败:", error);
      }
    };

    checkResonanceStatus();
  }, [storyId, isAuthenticated]);

  const handleResonance = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      const response = await fetch(`/api/stories/${storyId}/resonance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasResonated(data.resonated);
        setResonanceCount(data.resonanceCount);
      }
    } catch (error) {
      console.error("共鸣操作失败:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `来看看这个故事：${title}`,
          url,
        });
      } catch (error) {
        console.log("分享取消");
      }
    } else {
      // Copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("复制失败:", error);
      }
    }
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark API
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Resonance Button */}
          <button
            onClick={handleResonance}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300
              ${hasResonated
                ? "bg-red-50 text-red-500 border-2 border-red-200"
                : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
              }
              ${isAnimating ? "scale-110" : "scale-100"}
              ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <Heart
              className={`
                w-5 h-5 transition-all duration-300
                ${hasResonated ? "fill-current" : ""}
                ${isAnimating ? "scale-125" : ""}
              `}
            />
            <span className="text-sm font-semibold">
              {hasResonated ? "已共鸣" : "共鸣"}
            </span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm font-bold">{resonanceCount}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {copied ? "已复制" : "分享"}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-full transition-colors
              ${isBookmarked
                ? "bg-yellow-50 text-yellow-600"
                : "bg-gray-50 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600"
              }
            `}
          >
            <Bookmark
              className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
            />
            <span className="text-sm font-medium">
              {isBookmarked ? "已收藏" : "收藏"}
            </span>
          </button>
        </div>

        {/* View Count */}
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{resonanceCount + 1} 人共鸣过</span>
        </div>
      </div>
    </section>
  );
}
