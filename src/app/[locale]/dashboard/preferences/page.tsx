"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Briefcase, DollarSign, MapPin, Monitor } from "lucide-react";

const CULTURE_TAGS = ["扁平管理", "技术驱动", "远程办公", "弹性工作", "大牛带队", "期权激励", "海外机会", "培训预算", "开源文化", "结果导向"];
const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同工" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];
const LOCATIONS = ["北京", "上海", "深圳", "广州", "杭州", "成都", "南京", "武汉", "西安", "远程"];
const EXPERIENCE_LEVELS = [
  { value: "ENTRY", label: "应届/初级" },
  { value: "MID", label: "中级" },
  { value: "SENIOR", label: "高级" },
  { value: "EXECUTIVE", label: "专家/管理" },
];

export default function PreferencesPage({ params }: { params: Promise<{ locale: string }> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState("zh");
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
    params.then(p => setLocale(p.locale));
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      cultureTags: prev.cultureTags.includes(tag) ? prev.cultureTags.filter(t => t !== tag) : [...prev.cultureTags, tag],
    }));
  };

  const toggleType = (type: string) => {
    setForm(prev => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(type) ? prev.employmentTypes.filter(t => t !== type) : [...prev.employmentTypes, type],
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
        alert(locale === "en" ? "Saved successfully!" : "保存成功！");
      } else {
        alert("保存失败");
      }
    } catch (e) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const isEn = locale === "en";

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">{isEn ? "Loading..." : "加载中..."}</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEn ? "Job Preferences" : "求职偏好"}</h1>
            <p className="text-gray-500 mt-1">{isEn ? "Set your preferences to get personalized recommendations" : "设置你的偏好以获得个性化推荐"}</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? (isEn ? "Saving..." : "保存中...") : (isEn ? "Save" : "保存")}
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Culture */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {isEn ? "Preferred Company Culture" : "期望公司文化"}
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
              {isEn ? "Expected Salary (K/month)" : "期望薪资 (K/月)"}
            </h2>
            <div className="flex items-center gap-4">
              <input type="number" value={form.salaryMin} onChange={e => setForm(prev => ({ ...prev, salaryMin: e.target.value }))} placeholder={isEn ? "Min" : "最低"} className="w-32 border rounded-lg px-3 py-2" />
              <span className="text-gray-400">—</span>
              <input type="number" value={form.salaryMax} onChange={e => setForm(prev => ({ ...prev, salaryMax: e.target.value }))} placeholder={isEn ? "Max" : "最高"} className="w-32 border rounded-lg px-3 py-2" />
            </div>
          </div>

          {/* Employment Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{isEn ? "Employment Type" : "工作类型"}</h2>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map(type => (
                <button key={type.value} onClick={() => toggleType(type.value)} className={`px-3 py-1.5 rounded-full text-sm transition ${form.employmentTypes.includes(type.value) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              {isEn ? "Preferred Location" : "期望工作地点"}
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
              {isEn ? "Remote Preference" : "远程偏好"}
            </h2>
            <div className="flex gap-3">
              {[
                { value: "FULL_REMOTE", label: isEn ? "Full Remote" : "完全远程" },
                { value: "HYBRID", label: isEn ? "Hybrid" : "混合办公" },
                { value: "ONSITE", label: isEn ? "On-site" : "坐班" },
              ].map(opt => (
                <button key={opt.value} onClick={() => setForm(prev => ({ ...prev, remotePreference: prev.remotePreference === opt.value ? "" : opt.value }))} className={`flex-1 py-2 rounded-lg text-sm transition ${form.remotePreference === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{isEn ? "Experience Level" : "经验级别"}</h2>
            <div className="flex gap-3">
              {EXPERIENCE_LEVELS.map(level => (
                <button key={level.value} onClick={() => setForm(prev => ({ ...prev, experienceLevel: prev.experienceLevel === level.value ? "" : level.value }))} className={`flex-1 py-2 rounded-lg text-sm transition ${form.experienceLevel === level.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
