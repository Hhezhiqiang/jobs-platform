"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { User, MapPin, Calendar, BookOpen, Briefcase, Award, FileText, Edit2 } from "lucide-react";
import Link from "next/link";
import { logger } from '@/lib/logger';

export default function ProfilePage() {
  const t = useTranslations("dashboard.profilePage");
  const tSections = useTranslations("dashboard.profilePage.sections");
  const tFields = useTranslations("dashboard.profilePage.fields");
  const tSkills = useTranslations("dashboard.profilePage.skills");
  const tActions = useTranslations("dashboard.profilePage.actions");
  const tLinks = useTranslations("dashboard.profilePage.links");
  const locale = useLocale();

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    gender: "",
    birthday: "",
    location: "",
    bio: "",
    skills: [] as string[],
    workExperience: null,
    education: null,
  });
  const [newSkill, setNewSkill] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 未登录重定向
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
      return;
    }
  }, [sessionStatus, router, locale]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.status === 401) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.users);
        const p = data.profile || {};
        setProfile({
          gender: p.gender || "",
          birthday: p.birthday ? p.birthday.substring(0, 10) : "",
          location: p.location || "",
          bio: p.bio || "",
          skills: p.skills || [],
          workExperience: p.workExperience,
          education: p.education,
        });
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            gender: profile.gender || null,
            birthday: profile.birthday || null,
            location: profile.location || null,
            bio: profile.bio || null,
            skills: profile.skills,
          },
        }),
      });
      if (res.ok) {
        setEditingSection(null);
        fetchData();
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev: any) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev: any) => ({ ...prev, skills: prev.skills.filter((s: string) => s !== skill) }));
  };

  // 计算完成度
  const completeness = useCallback(() => {
    let filled = 0;
    const total = 6;
    if (profile.gender) filled++;
    if (profile.location) filled++;
    if (profile.bio) filled++;
    if (profile.skills.length > 0) filled++;
    if (profile.birthday) filled++;
    if (profile.workExperience || profile.education) filled++;
    return Math.round((filled / total) * 100);
  }, [profile]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">{t("loading")}</div></div>;

  const comp = completeness();
  const genderLabel = (g: string) => {
    if (g === "MALE") return tFields("male");
    if (g === "FEMALE") return tFields("female");
    if (g === "OTHER") return tFields("other");
    return g || "-";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-500 mt-1">{t("subtitle")}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{t("completenessLabel")}</div>
            <div className={`text-2xl font-bold ${comp >= 80 ? "text-green-600" : comp >= 50 ? "text-yellow-600" : "text-red-600"}`}>{comp}%</div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
              <div className={`h-2 rounded-full transition-all ${comp >= 80 ? "bg-green-600" : comp >= 50 ? "bg-yellow-600" : "bg-red-600"}`} style={{ width: `${comp}%` }} />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {tSections("basic")}
              </h3>
              <button onClick={() => editingSection === "basic" ? handleSave() : setEditingSection("basic")} className="text-blue-600 text-sm flex items-center gap-1">
                {editingSection === "basic" ? (saving ? tActions("saving") : tActions("save")) : <><Edit2 className="w-4 h-4" />{tActions("edit")}</>}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{tFields("gender")}</label>
                {editingSection === "basic" ? (
                  <select value={profile.gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProfile((prev: any) => ({ ...prev, gender: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">{tFields("genderPlaceholder")}</option>
                    <option value="MALE">{tFields("male")}</option>
                    <option value="FEMALE">{tFields("female")}</option>
                    <option value="OTHER">{tFields("other")}</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{genderLabel(profile.gender)}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{tFields("location")}</label>
                {editingSection === "basic" ? (
                  <input value={profile.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: any) => ({ ...prev, location: e.target.value }))} className="w-full border rounded-lg px-3 py-2" placeholder={tFields("locationPlaceholder")} />
                ) : (
                  <p className="text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location || "-"}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{tFields("birthday")}</label>
                {editingSection === "basic" ? (
                  <input type="date" value={profile.birthday} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: any) => ({ ...prev, birthday: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
                ) : (
                  <p className="text-gray-900 flex items-center gap-1"><Calendar className="w-4 h-4" />{profile.birthday || "-"}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-500 mb-1 block">{tFields("bio")}</label>
              {editingSection === "basic" ? (
                <textarea value={profile.bio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile((prev: any) => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder={tFields("bioPlaceholder")} />
              ) : (
                <p className="text-gray-900">{profile.bio || "-"}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                {tSections("skills")}
              </h3>
              <button onClick={() => editingSection === "skills" ? handleSave() : setEditingSection("skills")} className="text-blue-600 text-sm flex items-center gap-1">
                {editingSection === "skills" ? (saving ? tActions("saving") : tActions("save")) : <><Edit2 className="w-4 h-4" />{tActions("edit")}</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.skills.map((skill: string) => (
                <span key={skill} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                  {skill}
                  {editingSection === "skills" && <button onClick={() => removeSkill(skill)} className="ml-1 text-purple-400 hover:text-purple-700">×</button>}
                </span>
              ))}
            </div>
            {editingSection === "skills" && (
              <div className="flex gap-2">
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder={tSkills("placeholder")} />
                <button onClick={addSkill} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700">{tSkills("add")}</button>
              </div>
            )}
            {profile.skills.length === 0 && editingSection !== "skills" && (
              <p className="text-gray-400 text-sm">{tSkills("empty")}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{tSections("quickActions")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href={`/${locale}/dashboard/resumes`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-700">{tLinks("resumes")}</span>
              </Link>
              <Link href={`/${locale}/dashboard/preferences`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                <Briefcase className="w-6 h-6 text-green-600" />
                <span className="text-sm text-gray-700">{tLinks("preferences")}</span>
              </Link>
              <Link href={`/${locale}/dashboard/recommended`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-sm text-gray-700">{tLinks("recommended")}</span>
              </Link>
              <Link href={`/${locale}/dashboard/job-progress`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 transition">
                <BookOpen className="w-6 h-6 text-yellow-600" />
                <span className="text-sm text-gray-700">{tLinks("progress")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
