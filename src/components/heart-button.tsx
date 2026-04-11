"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface HeartButtonProps {
  jobId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export function HeartButton({
  jobId,
  initialFavorited = false,
  size = "md",
  showText = false,
  className = "",
  onToggle,
}: HeartButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  // 检查收藏状态
  useEffect(() => {
    if (!isAuthenticated || initialFavorited) {
      setIsFavorited(initialFavorited);
      return;
    }

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/favorites/check/${jobId}`);
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      } catch (error) {
        console.error("检查收藏状态失败:", error);
      }
    };

    checkFavoriteStatus();
  }, [jobId, isAuthenticated, initialFavorited]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isFavorited) {
        // 取消收藏
        const response = await fetch(`/api/favorites?jobId=${jobId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setIsFavorited(false);
          onToggle?.(false);
        } else {
          console.error("取消收藏失败");
        }
      } else {
        // 添加收藏
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        });

        if (response.ok) {
          setIsFavorited(true);
          onToggle?.(true);
        } else {
          console.error("添加收藏失败");
        }
      }
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        transition-all duration-200
        ${isFavorited
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }
        ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
        ${showText ? "gap-2 px-4 w-auto" : ""}
        ${className}
      `}
      aria-label={isFavorited ? "取消收藏" : "添加收藏"}
      title={isFavorited ? "取消收藏" : "添加收藏"}
    >
      <svg
        className={`${iconSizes[size]} transition-transform ${isFavorited ? "scale-110" : "scale-100"}`}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={isFavorited ? 0 : 2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showText && (
        <span className="text-sm font-medium">
          {isFavorited ? "已收藏" : "收藏"}
        </span>
      )}
    </button>
  );
}
