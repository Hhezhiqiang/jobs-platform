"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  BarChart3,
  Eye,
  MessageSquare,
  TrendingUp,
  Edit,
  Trash2,
  Pause,
  Play,
  Crown,
  Clock,
  Calendar,
} from "lucide-react";

interface JobDemand {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  contactCount: number;
  isFeatured: boolean;
  featuredExpiresAt: string | null;
  createdAt: string;
  _count: {
    contacts: number;
  };
}

export default function JobDemandAnalyticsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.jobDemandAnalyticsPage");
  const { data: session } = useSession();
  const [demands, setDemands] = useState<JobDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const res = await fetch("/api/job-demands/manage");
      const result = await res.json();
      if (res.ok) {
        setDemands(result.data);
        const views = result.data.reduce((sum: number, d: JobDemand) => sum + d.viewCount, 0);
        const contacts = result.data.reduce((sum: number, d: JobDemand) => sum + d._count.contacts, 0);
        setTotalViews(views);
        setTotalContacts(contacts);
      }
    } catch {
      alert(t("alerts.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/job-demands/manage?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchDemands();
      }
    } catch {
      alert(t("alerts.operationFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("alerts.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/job-demands/manage?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDemands();
      }
    } catch {
      alert(t("alerts.deleteFailed"));
    }
  };

  const handleFeature = async (id: string, days: number) => {
    alert(t("alerts.featureDev", { days, price: (days * 9.9).toFixed(1) }));
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t("loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("stats.totalViews")}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("stats.totalContacts")}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalContacts}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("stats.activeDemands")}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {demands.filter(d => d.status === "OPEN").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Demand list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{t("listTitle")}</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {demands.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("empty.subtitle")}</p>
                <button
                  onClick={() => router.push(`/${locale}/dashboard/job-demand`)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  {t("empty.cta")}
                </button>
              </div>
            ) : (
              demands.map((demand) => (
                <div key={demand.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{demand.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          demand.status === "OPEN" ? "bg-green-100 text-green-700" :
                          demand.status === "CLOSED" ? "bg-gray-100 text-gray-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {demand.status === "OPEN" ? t("demandStatus.OPEN") :
                           demand.status === "CLOSED" ? t("demandStatus.CLOSED") : t("demandStatus.PAUSED")}
                        </span>
                        {demand.isFeatured && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {t("featuredBadge")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {t("viewsLabel", { count: demand.viewCount })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> {t("contactsLabel", { count: demand._count.contacts })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {new Date(demand.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(demand.id, demand.status === "OPEN" ? "PAUSED" : "OPEN")}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title={demand.status === "OPEN" ? t("actions.pause") : t("actions.resume")}
                      >
                        {demand.status === "OPEN" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(demand.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title={t("actions.delete")}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleFeature(demand.id, 7)}
                        className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
                        title={t("actions.featureSevenDays")}
                      >
                        <Crown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
