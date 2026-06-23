"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { logger } from '@/lib/logger';

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.startsWith("/en") ? "en" : "zh";

  useEffect(() => {
    logger.error("Company error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          页面出错了
        </h2>
        <p className="text-gray-600 mb-6">
          抱歉，加载企业后台时出现问题。请尝试刷新或返回首页。
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            重试
          </button>
          <button
            onClick={() => router.push(`/${locale}/company/dashboard`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
        
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              错误详情 (仅开发环境)
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-red-600 overflow-auto">
              {error.message}
              {error.digest && (
                <div className="mt-1 text-gray-500">Digest: {error.digest}</div>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
