"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface HeroSectionProps {
  jobCount: number;
  companyCount?: number;
}

export function HeroSection({ jobCount, companyCount }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";

  const hotTags = t.raw("hero.popularSearches") || [];
  const locations = t.raw("hero.locations") || [];

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3]">
        {/* Animated aurora orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6366f1]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#6366f1]/10 via-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-20 md:pt-10 md:pb-20 text-center">
        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          {t("hero.title")}
          <span className="block mt-2 bg-gradient-to-r from-[#a5b4fc] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">
            {t("hero.titleHighlight")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[#c7d2fe]/80 mb-12 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>

        {/* Search box */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2.5 max-w-3xl mx-auto border border-white/20 shadow-2xl">
          <form action={`/${locale}/jobs`} className="flex flex-col md:flex-row gap-2.5">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5b4fc]/60">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                name="q"
                placeholder={t("hero.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-white bg-white/5 rounded-xl border border-white/10 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-[#6366f1]/50 text-lg transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5b4fc]/60">
                <MapPin className="w-5 h-5" />
              </div>
              <select
                name="city"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full md:w-48 pl-12 pr-8 py-4 text-white bg-white/5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 appearance-none cursor-pointer transition-all"
              >
                <option value="" className="bg-[#1e1b4b] text-white">{t("hero.allCities")}</option>
                {locations.map((loc: string) => (
                  <option key={loc} value={loc} className="bg-[#1e1b4b] text-white">{loc}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl font-semibold text-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all hover:shadow-lg hover:shadow-[#6366f1]/25 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {t("hero.searchButton")}
            </button>
          </form>
        </div>

        {/* Hot tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="text-sm text-[#a5b4fc]/60">{t("hero.popularSearchesLabel")}：</span>
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
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/jobs`}
              className="px-8 py-3.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#1e1b4b] font-semibold rounded-xl hover:from-[#f59e0b] hover:to-[#d97706] transition-all hover:shadow-lg hover:shadow-[#fbbf24]/25 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              {t("home.viewAllJobs")}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl backdrop-blur-sm transition-all border border-white/10 flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              {t("nav.dashboard")}
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/auth/register`}
              className="px-8 py-3.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#1e1b4b] font-semibold rounded-xl hover:from-[#f59e0b] hover:to-[#d97706] transition-all hover:shadow-lg hover:shadow-[#fbbf24]/25"
            >
              {t("home.cta.register")}
            </Link>
            <Link
              href={`/${locale}/auth/login`}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl backdrop-blur-sm transition-all border border-white/10"
            >
              {t("hero.login")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
