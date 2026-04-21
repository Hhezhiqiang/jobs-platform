import { Metadata } from "next";
import Link from "next/link";
import { Search, MessageCircle, Mail, ChevronRight, HelpCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: t.raw("meta.keywords"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: `${siteUrl}/${locale}/faq`,
      siteName: "JobQuip",
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${siteUrl}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.description"),
      images: [`${siteUrl}/logo.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/faq`,
      languages: {
        "zh-CN": `${siteUrl}/zh/faq`,
        "en": `${siteUrl}/en/faq`,
        "x-default": `${siteUrl}/zh/faq`,
      },
    },
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("faq");
  const faqData = t.raw("categories");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqData as Array<{ category: string; items: Array<{ question: string; answer: string }> }>).flatMap(cat =>
      cat.items.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    )
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <HelpCircle className="w-4 h-4" />
              {t("hero.badge")}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-blue-100 mb-8">{t("hero.subtitle")}</p>

            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder={t("hero.searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {(faqData as Array<{ category: string; items: Array<{ question: string; answer: string }> }>).map((category, catIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                  {catIndex + 1}
                </span>
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.items.map((item, index) => (
                  <article
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{item.question}</span>
                    </h3>
                    <div className="text-gray-700 leading-relaxed pl-8">
                      {item.answer}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">{t("contact.title")}</h2>
            <p className="text-blue-100 mb-6">{t("contact.subtitle")}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/contact`}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {t("contact.contactUs")}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                {t("contact.moreArticles")}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
