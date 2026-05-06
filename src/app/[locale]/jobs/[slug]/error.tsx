"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logger } from '@/lib/logger';

export default function JobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Job detail error:", error);
  }, [error]);

  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">{isEn ? "Page Failed to Load" : "职位页面加载失败"}</h2>
        <div className="bg-red-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800 break-all">
            <strong>{isEn ? "Digest:" : "摘要:"}</strong> {error.digest || "N/A"}
          </p>
          <p className="text-sm font-mono text-red-800 break-all mt-2">
            <strong>{isEn ? "Message:" : "消息:"}</strong> {error.message}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            {isEn ? "Retry" : "重试"}
          </button>
          <Link href={`/${locale}/jobs`} className="inline-flex items-center text-blue-600 hover:underline">
            {isEn ? "← Back to Jobs" : "← 返回职位列表"}
          </Link>
        </div>
      </div>
    </div>
  );
}
