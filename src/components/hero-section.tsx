"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Sparkles, TrendingUp, Users, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface HeroSectionProps {
  jobCount: number;
}

export function HeroSection({ jobCount }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";

  const hotTags = t.raw("hero.popularSearches") || [];
  const locations = t.raw("hero.locations") || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-24 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-sm mb-8 border border-white/10">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{jobCount.toLocaleString()}+ {t("hero.stats.jobs")}</span>
          <span className="w-1 h-1 bg-white/40 rounded-full" />
          <span className="text-white/60">{t("hero.stats.companies")}</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          {t("hero.title")}
          <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {t("hero.titleHighlight") || ""}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-blue-200/80 mb-12 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>

        {/* Search box */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 max-w-3xl mx-auto border border-white/20 shadow-2xl">
          <form action={`/${locale}/jobs`} className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                name="q"
                placeholder={t("hero.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t("hero.searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 text-white bg-white/5 rounded-xl border border-white/10 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-lg transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60">
                <MapPin className="w-5 h-5" />
              </div>
              <select
                name="city"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label={t("hero.selectCity")}
                className="w-full md:w-48 pl-12 pr-8 py-4 text-white bg-white/5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
              >
                <option value="" className="bg-slate-800 text-white">{t("hero.allCities")}</option>
                {locations.map((loc: string) => (
                  <option key={loc} value={loc} className="bg-slate-800 text-white">{loc}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {t("hero.searchButton")}
            </button>
          </form>
        </div>

        {/* Hot tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="text-sm text-blue-300/60">{t("hero.popularSearchesLabel")}</span>
          {hotTags.map((tag: string) => (
            <Link
              key={tag}
              href={`/${locale}/jobs?q=${encodeURIComponent(tag)}`}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-sm transition-all border border-white/10 hover:border-white/20"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* CTA */}
        {isLoggedIn ? (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/jobs`}
              className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              {t("home.viewAllJobs")}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl backdrop-blur-sm transition-all border border-white/10 flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              {t("nav.dashboard")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/auth/register`}
              className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all hover:shadow-lg hover:shadow-amber-500/25"
            >
              {t("hero.register")}
            </Link>
            <Link
              href={`/${locale}/auth/login`}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl backdrop-blur-sm transition-all border border-white/10"
            >
              {t("hero.login")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
