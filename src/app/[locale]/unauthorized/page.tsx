import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Unauthorized" : "无权访问",
  };
}

export default async function UnauthorizedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {locale === "en" ? "Unauthorized" : "无权访问"}
        </h3>
        <p className="text-gray-500 mb-6 text-sm">
          {locale === "en" ? "You do not have permission to access this page." : "您没有权限访问此页面"}
        </p>
        <Link href={`/${locale}/auth/login`} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {locale === "en" ? "Go to Login" : "返回登录"}
        </Link>
      </div>
    </div>
  );
}
