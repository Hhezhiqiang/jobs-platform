import Link from "next/link";

export default async function AuthErrorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">登录失败</h1>
        <p className="text-gray-600 mb-8">
          认证过程中出现错误，请稍后重试或更换登录方式。
        </p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回登录页
        </Link>
      </div>
    </div>
  );
}
