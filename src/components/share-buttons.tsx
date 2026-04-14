"use client";

import { useState } from "react";
import { Share2, Twitter, Linkedin, Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

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
        console.log("Share cancelled");
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
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">分享到:</span>
      
      {/* 原生分享（移动端） */}
      {typeof navigator !== "undefined" && navigator.share && (
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
        <Twitter className="w-4 h-4 text-blue-500" />
      </button>

      {/* LinkedIn */}
      <button
        onClick={handleLinkedInShare}
        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
        title="分享到 LinkedIn"
      >
        <Linkedin className="w-4 h-4 text-blue-700" />
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
