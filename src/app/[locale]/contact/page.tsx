import Link from "next/link";
import { Metadata } from "next";

const SITE_NAME = "JobQuip招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

const translations = {
  zh: {
    title: `联系我们 - ${SITE_NAME}`,
    description: "联系JobQuip招聘平台，获取更多帮助与支持。我们致力于为您提供最优质的求职招聘服务。",
    keywords: ["联系我们", "招聘平台", "客户服务", "求职帮助", "招聘咨询"],
  },
  en: {
    title: `Contact Us - ${SITE_NAME}`,
    description: "Contact JobQuip recruitment platform for help and support. We are committed to providing you with the best job recruitment service.",
    keywords: ["contact us", "customer service", "recruitment platform", "help", "support"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = translations[locale === "en" ? "en" : "zh"];
  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${SITE_URL}/${locale}/contact`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/contact`,
        "en": `${SITE_URL}/en/contact`,
        "x-default": `${SITE_URL}/zh/contact`,
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/`} className="text-blue-600 hover:text-blue-800">
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
            <p className="text-gray-600">如有任何问题，请通过页面右下角的在线客服与我们联系。</p>
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
