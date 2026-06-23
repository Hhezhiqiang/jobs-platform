"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Briefcase, MapPin, DollarSign, Tag, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function DashboardJobDemandPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.jobDemandPage");
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    salaryMin: "",
    salaryMax: "",
    currency: "CNY",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/job-demands/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setPublished(true);
        setTimeout(() => {
          router.push(`/${locale}/job-demands`);
        }, 2000);
      } else {
        alert(result.error || t("errors.publishFailed"));
      }
    } catch {
      alert(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

        {published ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">{t("successTitle")}</h2>
            <p className="text-green-600 mb-4">{t("successMessage")}</p>
            <p className="text-sm text-green-500">{t("redirecting")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Smart tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">{t("smartTip.title")}</h3>
                  <p className="text-sm text-blue-700">
                    {t("smartTip.content")}
                  </p>
                </div>
              </div>
            </div>

            {/* Job intent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                {t("form.intent")}
              </label>
              <input
                type="text"
                placeholder={t("form.intentPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Salary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t("form.salaryMin")}
                </label>
                <input
                  type="number"
                  placeholder={t("form.salaryMinPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("form.salaryMax")}
                </label>
                <input
                  type="number"
                  placeholder={t("form.salaryMaxPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("form.currency")}</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="CNY">{t("form.currencyOptions.CNY")}</option>
                  <option value="USD">{t("form.currencyOptions.USD")}</option>
                  <option value="EUR">{t("form.currencyOptions.EUR")}</option>
                  <option value="GBP">{t("form.currencyOptions.GBP")}</option>
                  <option value="JPY">{t("form.currencyOptions.JPY")}</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t("form.location")}
              </label>
              <input
                type="text"
                placeholder={t("form.locationPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {/* Skill tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                {t("form.skills")}
              </label>
              <p className="text-xs text-gray-500 mb-2">{t("form.skillsHint")}</p>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500">{t("form.skillsPlaceholder")}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {loading ? t("form.submitting") : t("form.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
