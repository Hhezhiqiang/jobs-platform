"use client";

import { useState, useEffect } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { logger } from '@/lib/logger';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

// Twitter X Logo SVG
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn Logo SVG
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const shareData = {
    title,
    text: description || title,
    url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
      }
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${title} ${url}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleLinkedInShare = () => {
    const text = encodeURIComponent(title);
    const summary = encodeURIComponent(description || title);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">分享到:</span>
      
      {/* 原生分享（移动端） */}
      {canShare && (
        <button
          onClick={handleNativeShare}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title="分享"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Twitter */}
      <button
        onClick={handleTwitterShare}
        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
        title="分享到 Twitter"
      >
        <TwitterIcon className="w-4 h-4 text-blue-500" />
      </button>

      {/* LinkedIn */}
      <button
        onClick={handleLinkedInShare}
        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
        title="分享到 LinkedIn"
      >
        <LinkedInIcon className="w-4 h-4 text-blue-700" />
      </button>

      {/* 复制链接 */}
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title={copied ? "已复制!" : "复制链接"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Link2 className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}
