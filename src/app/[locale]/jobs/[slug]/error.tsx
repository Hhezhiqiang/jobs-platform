"use client";

import { useEffect } from "react";

export default function JobDetailError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Job detail error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">职位页面加载失败</h2>
        <div className="bg-red-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800 break-all">
            <strong>Digest:</strong> {error.digest || "N/A"}
          </p>
          <p className="text-sm font-mono text-red-800 break-all mt-2">
            <strong>Message:</strong> {error.message}
          </p>
          {error.stack && (
            <pre className="text-xs font-mono text-red-700 mt-2 whitespace-pre-wrap max-h-64 overflow-auto">
              {error.stack}
            </pre>
          )}
        </div>
        <a href="/zh/jobs" className="text-blue-600 hover:underline">← 返回职位列表</a>
      </div>
    </div>
  );
}
