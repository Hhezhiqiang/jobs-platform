"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logger } from '@/lib/logger';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: Error };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // 开发环境打印完整错误到控制台
    logger.error("Admin page error:", error);
    logger.error("Error digest:", error.digest);
    logger.error("Error message:", error.message);
    logger.error("Error stack:", error.stack);
    if (error.cause) {
      logger.error("Error cause:", error.cause);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">管理页面加载失败</h2>
        <p className="text-gray-500 mb-4 text-sm">
          {error.message || "服务器处理请求时遇到了问题"}
        </p>
        
        {error.digest && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showDetails ? "隐藏" : "显示"}详细错误信息
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  Digest: {error.digest}
                </p>
                <p className="text-xs font-mono text-red-700 break-all mt-1">
                  Message: {error.message}
                </p>
                {error.cause && (
                  <p className="text-xs font-mono text-red-700 break-all mt-1">
                    Cause: {JSON.stringify(error.cause)}
                  </p>
                )}
                {error.stack && (
                  <pre className="text-xs font-mono text-red-700 break-all mt-1 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
          <button
            onClick={() => router.push(`/${locale}/auth/login/admin`)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            返回登录
          </button>
        </div>
      </div>
    </div>
  );
}
