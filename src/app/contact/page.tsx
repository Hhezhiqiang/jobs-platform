import Link from "next/link";
import { Metadata } from "next";

const SITE_NAME = "JobsBro招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";

export const metadata: Metadata = {
  title: `联系我们 - ${SITE_NAME}`,
  description: "联系JobsBro招聘平台，获取更多帮助与支持。我们致力于为您提供最优质的求职招聘服务。",
  keywords: ["联系我们", "招聘平台", "客户服务", "求职帮助", "招聘咨询"],
  openGraph: {
    title: `联系我们 - ${SITE_NAME}`,
    description: "联系JobsBro招聘平台，获取更多帮助与支持。",
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: `联系我们 - ${SITE_NAME}`,
    description: "联系JobsBro招聘平台，获取更多帮助与支持。",
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold">联系我们</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-6">联系方式</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📧</div>
                <div>
                  <p className="text-gray-600">电子邮箱</p>
                  <a href="mailto:support@jobs-platform.com" className="text-blue-600 hover:text-blue-800 text-lg">
                    support@jobs-platform.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">📞</div>
                <div>
                  <p className="text-gray-600">联系电话</p>
                  <p className="text-lg">400-123-4567</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">📍</div>
                <div>
                  <p className="text-gray-600">公司地址</p>
                  <p className="text-lg">北京市朝阳区建国路88号</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">工作时间</h2>
            <p className="text-gray-700">周一至周五：9:00 - 18:00</p>
            <p className="text-gray-700">周末及节假日：休息</p>
          </section>
        </div>
      </main>
    </div>
  );
}
