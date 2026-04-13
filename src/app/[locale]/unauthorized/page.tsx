export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "无权访问 - Jobs Platform",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">无权访问</h1>
        <p className="text-gray-600 mb-6">
          您没有权限查看此页面。如需帮助，请联系管理员。
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/auth/login"
            className="w-full py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            切换账号登录
          </Link>
        </div>
      </div>
    </div>
  );
}
