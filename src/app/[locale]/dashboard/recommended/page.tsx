"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Briefcase, MapPin, DollarSign, Star, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { logger } from '@/lib/logger';

interface RecommendedJob {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  isFeatured: boolean;
  companies?: { name: string } | null;
  matchReasons?: string[];
}

export default function RecommendedJobsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.recommendedPage");
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    fetchRecommended();
  }, []);

  const fetchRecommended = async () => {
    try {
      const res = await fetch("/api/recommendations?limit=20");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setIsPersonalized(data.isPersonalized);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            {isPersonalized && (
              <span className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                {t("personalized")}
              </span>
            )}
          </div>
          <p className="text-gray-500">
            {isPersonalized ? t("subtitlePersonalized") : t("subtitleDefault")}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="flex gap-3">
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                  <div className="h-6 bg-gray-100 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty.title")}</h3>
            <p className="text-gray-500 mb-6">{t("empty.subtitle")}</p>
            <Link href={`/${locale}/dashboard/preferences`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              {t("empty.cta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link href={`/${locale}/jobs/${job.slug}`} key={job.id} className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">{job.title}</h3>
                      {job.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-gray-600 mb-3">{job.companies?.name}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {job.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      )}
                      {job.salaryMin && job.salaryMax && (
                        <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salaryMin}-{job.salaryMax}K</span>
                      )}
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.employmentType === "FULL_TIME" ? t("fullTime") : job.employmentType}</span>
                    </div>
                    {job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.matchReasons.slice(0, 3).map((reason: string, i: number) => (
                          <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{reason}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition flex-shrink-0 mt-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
