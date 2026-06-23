"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Briefcase, DollarSign, MapPin, Monitor } from "lucide-react";
import { logger } from '@/lib/logger';

// Culture tags / locations are stored as values in the DB and are intentionally
// not translated (user data). Section labels and option labels are translated.
const CULTURE_TAGS = ["扁平管理", "技术驱动", "远程办公", "弹性工作", "大牛带队", "期权激励", "海外机会", "培训预算", "开源文化", "结果导向"];
const EMPLOYMENT_TYPE_KEYS = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const LOCATIONS = ["北京", "上海", "深圳", "广州", "杭州", "成都", "南京", "武汉", "西安", "远程"];
const EXPERIENCE_LEVEL_KEYS = ["ENTRY", "MID", "SENIOR", "EXECUTIVE"] as const;
const REMOTE_KEYS = ["FULL_REMOTE", "HYBRID", "ONSITE"] as const;

export default function PreferencesPage() {
  const t = useTranslations("dashboard.preferencesPage");
  const tCommon = useTranslations("dashboard.common");
  const tEmp = useTranslations("dashboard.preferencesPage.employmentTypes");
  const tExp = useTranslations("dashboard.preferencesPage.experienceLevels");
  const tRemote = useTranslations("dashboard.preferencesPage.remote");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cultureTags: [] as string[],
    salaryMin: "" as string,
    salaryMax: "" as string,
    employmentTypes: [] as string[],
    locations: [] as string[],
    remotePreference: "" as string,
    experienceLevel: "" as string,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/job-preferences");
      if (res.ok) {
        const data = await res.json();
        setForm({
          cultureTags: data.cultureTags || [],
          salaryMin: data.salaryMin ? String(data.salaryMin) : "",
          salaryMax: data.salaryMax ? String(data.salaryMax) : "",
          employmentTypes: data.employmentTypes || [],
          locations: data.locations || [],
          remotePreference: data.remotePreference || "",
          experienceLevel: data.experienceLevel || "",
        });
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      cultureTags: prev.cultureTags.includes(tag) ? prev.cultureTags.filter(x => x !== tag) : [...prev.cultureTags, tag],
    }));
  };

  const toggleType = (type: string) => {
    setForm(prev => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(type) ? prev.employmentTypes.filter(x => x !== type) : [...prev.employmentTypes, type],
    }));
  };

  const toggleLocation = (loc: string) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.includes(loc) ? prev.locations.filter(l => l !== loc) : [...prev.locations, loc],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/job-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cultureTags: form.cultureTags,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
          employmentTypes: form.employmentTypes,
          locations: form.locations,
          remotePreference: form.remotePreference || null,
          experienceLevel: form.experienceLevel || null,
        }),
      });
      if (res.ok) {
        alert(t("savedSuccess"));
      } else {
        alert(t("savedFailed"));
      }
    } catch (e) {
      alert(t("savedFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">{t("loading")}</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-500 mt-1">{t("subtitle")}</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? tCommon("saving") : tCommon("save")}
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Culture */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {t("sections.culture")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {CULTURE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-sm transition ${form.cultureTags.includes(tag) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Salary */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              {t("sections.salary")}
            </h2>
            <div className="flex items-center gap-4">
              <input type="number" value={form.salaryMin} onChange={e => setForm(prev => ({ ...prev, salaryMin: e.target.value }))} placeholder={t("salary.min")} className="w-32 border rounded-lg px-3 py-2" />
              <span className="text-gray-400">—</span>
              <input type="number" value={form.salaryMax} onChange={e => setForm(prev => ({ ...prev, salaryMax: e.target.value }))} placeholder={t("salary.max")} className="w-32 border rounded-lg px-3 py-2" />
            </div>
          </div>

          {/* Employment Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("sections.employmentType")}</h2>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPE_KEYS.map(typeKey => (
                <button key={typeKey} onClick={() => toggleType(typeKey)} className={`px-3 py-1.5 rounded-full text-sm transition ${form.employmentTypes.includes(typeKey) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {tEmp(typeKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              {t("sections.location")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button key={loc} onClick={() => toggleLocation(loc)} className={`px-3 py-1.5 rounded-full text-sm transition ${form.locations.includes(loc) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Remote Preference */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-600" />
              {t("sections.remote")}
            </h2>
            <div className="flex gap-3">
              {REMOTE_KEYS.map(optKey => (
                <button key={optKey} onClick={() => setForm(prev => ({ ...prev, remotePreference: prev.remotePreference === optKey ? "" : optKey }))} className={`flex-1 py-2 rounded-lg text-sm transition ${form.remotePreference === optKey ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {tRemote(optKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("sections.experience")}</h2>
            <div className="flex gap-3">
              {EXPERIENCE_LEVEL_KEYS.map(levelKey => (
                <button key={levelKey} onClick={() => setForm(prev => ({ ...prev, experienceLevel: prev.experienceLevel === levelKey ? "" : levelKey }))} className={`flex-1 py-2 rounded-lg text-sm transition ${form.experienceLevel === levelKey ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {tExp(levelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
