"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Briefcase, MapPin, DollarSign, Eye, Clock, CheckCircle, XCircle, Send, ChevronRight } from "lucide-react";
import { logger } from '@/lib/logger';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  PENDING: { icon: Send, color: "text-blue-700", bg: "bg-blue-100" },
  VIEWED: { icon: Eye, color: "text-yellow-700", bg: "bg-yellow-100" },
  INTERVIEW: { icon: Clock, color: "text-purple-700", bg: "bg-purple-100" },
  OFFER: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
  WITHDRAWN: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
};

export default function JobProgressPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.jobProgressPage");
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Count by status
  const statusCount: Record<string, number> = {};
  applications.forEach(app => {
    statusCount[app.status] = (statusCount[app.status] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        {/* Status stat cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <div key={status} className={`${config.bg} rounded-xl p-4 text-center`}>
                <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
                <div className={`text-xl font-bold ${config.color}`}>{statusCount[status] || 0}</div>
                <div className={`text-xs ${config.color} opacity-80`}>{t(`status.${status}` as any)}</div>
              </div>
            );
          })}
        </div>

        {/* Application list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t("loading")}</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty.title")}</h3>
            <p className="text-gray-500 mb-6">{t("empty.subtitle")}</p>
            <Link href={`/${locale}/jobs`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              {t("empty.cta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map(app => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
              const Icon = config.icon;
              return (
                <Link href={`/${locale}/jobs/${app.jobs?.slug}`} key={app.id} className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition group">
                  <div className="flex items-center gap-4">
                    <div className={`${config.bg} rounded-lg p-2.5 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">{app.jobs?.title}</h3>
                        <span className={`${config.bg} ${config.color} text-xs px-2.5 py-1 rounded-full flex-shrink-0 ml-2`}>
                          {t(`status.${app.status}` as any)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{app.jobs?.companies?.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.jobs?.location || "-"}</span>
                        {app.jobs?.salaryMin && app.jobs?.salaryMax && (
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{app.jobs.salaryMin}-{app.jobs.salaryMax}K</span>
                        )}
                        <span>{t("appliedOn")} {new Date(app.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
