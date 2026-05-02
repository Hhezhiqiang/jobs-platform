"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export function HomeCTA() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const t = useTranslations("home");

  return (
    <section className="py-12 md:py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">{t("cta.title")}</h2>
        <p className="text-base md:text-xl text-gray-400 mb-10">{t("cta.subtitle")}</p>
        
        {isLoggedIn ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'zh'}/jobs`}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
            >
              {t("cta.browseJobs")}
            </Link>
            <Link
              href={`/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'zh'}/dashboard`}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {typeof window !== 'undefined' ? window.location.pathname.split('/')[1] === 'en' ? "Dashboard" : "个人中心"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'zh'}/auth/register`}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {t("cta.register")}
            </Link>
            <Link
              href={`/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'zh'}/jobs`}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {t("cta.browseJobs")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
