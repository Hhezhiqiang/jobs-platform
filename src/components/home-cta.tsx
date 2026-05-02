"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

interface HomeCTAProps {
  isLoggedIn: boolean;
}

export function HomeCTA({ isLoggedIn }: HomeCTAProps) {
  const t = useTranslations("home");
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";

  if (isLoggedIn) {
    return (
      <section className="py-12 md:py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">{t("cta.title")}</h2>
          <p className="text-base md:text-xl text-gray-400 mb-10">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/jobs`}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
            >
              {t("cta.browseJobs")}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {locale === 'en' ? "My Dashboard" : "个人中心"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">{t("cta.title")}</h2>
        <p className="text-base md:text-xl text-gray-400 mb-10">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/auth/register`}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {t("cta.register")}
          </Link>
          <Link
            href={`/${locale}/jobs`}
            className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            {t("cta.browseJobs")}
          </Link>
        </div>
      </div>
    </section>
  );
}
