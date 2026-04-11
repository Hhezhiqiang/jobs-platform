"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="text-center max-w-md px-6">
          <h1 className="text-6xl font-bold mb-4">500</h1>
          <p className="text-xl mb-2">系统出现了一些问题</p>
          <p className="text-gray-500 mb-8">{error.message || "请稍后再试，或联系管理员"}</p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
