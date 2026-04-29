"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { User, Save, MapPin, Calendar, BookOpen, Briefcase, Award, FileText, Upload, Edit2 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [locale, setLocale] = useState("zh");
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
    params.then(p => setLocale(p.locale)).catch(() => {});
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
      console.error(e);
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
      console.error(e);
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

  const isEn = locale === "en";

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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">{isEn ? "Loading..." : "加载中..."}</div></div>;

  const comp = completeness();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEn ? "My Profile" : "个人资料"}</h1>
            <p className="text-gray-500 mt-1">{isEn ? "Complete your profile to get better job recommendations" : "完善资料以获得更好的职位推荐"}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{isEn ? "Profile Completeness" : "资料完整度"}</div>
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
                {isEn ? "Basic Info" : "基本信息"}
              </h3>
              <button onClick={() => editingSection === "basic" ? handleSave() : setEditingSection("basic")} className="text-blue-600 text-sm flex items-center gap-1">
                {editingSection === "basic" ? (saving ? (isEn ? "Saving..." : "保存中...") : (isEn ? "Save" : "保存")) : <><Edit2 className="w-4 h-4" />{isEn ? "Edit" : "编辑"}</>}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{isEn ? "Gender" : "性别"}</label>
                {editingSection === "basic" ? (
                  <select value={profile.gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProfile((prev: any) => ({ ...prev, gender: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">{isEn ? "Select" : "请选择"}</option>
                    <option value="MALE">{isEn ? "Male" : "男"}</option>
                    <option value="FEMALE">{isEn ? "Female" : "女"}</option>
                    <option value="OTHER">{isEn ? "Other" : "其他"}</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.gender === "MALE" ? (isEn ? "Male" : "男") : profile.gender === "FEMALE" ? (isEn ? "Female" : "女") : profile.gender || "-"}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{isEn ? "Location" : "所在城市"}</label>
                {editingSection === "basic" ? (
                  <input value={profile.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: any) => ({ ...prev, location: e.target.value }))} className="w-full border rounded-lg px-3 py-2" placeholder={isEn ? "e.g. Beijing" : "例如：北京"} />
                ) : (
                  <p className="text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location || "-"}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{isEn ? "Birthday" : "生日"}</label>
                {editingSection === "basic" ? (
                  <input type="date" value={profile.birthday} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: any) => ({ ...prev, birthday: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
                ) : (
                  <p className="text-gray-900 flex items-center gap-1"><Calendar className="w-4 h-4" />{profile.birthday || "-"}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-500 mb-1 block">{isEn ? "Bio" : "个人简介"}</label>
              {editingSection === "basic" ? (
                <textarea value={profile.bio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile((prev: any) => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder={isEn ? "Introduce yourself..." : "介绍一下自己..."} />
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
                {isEn ? "Skills" : "技能"}
              </h3>
              <button onClick={() => editingSection === "skills" ? handleSave() : setEditingSection("skills")} className="text-blue-600 text-sm flex items-center gap-1">
                {editingSection === "skills" ? (saving ? (isEn ? "Saving..." : "保存中...") : (isEn ? "Save" : "保存")) : <><Edit2 className="w-4 h-4" />{isEn ? "Edit" : "编辑"}</>}
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
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder={isEn ? "Add a skill..." : "添加技能..."} />
                <button onClick={addSkill} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700">{isEn ? "Add" : "添加"}</button>
              </div>
            )}
            {profile.skills.length === 0 && editingSection !== "skills" && (
              <p className="text-gray-400 text-sm">{isEn ? "No skills added yet" : "还没有添加技能"}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{isEn ? "Quick Actions" : "快捷操作"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href={`/${locale}/dashboard/resumes`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-700">{isEn ? "Resumes" : "简历管理"}</span>
              </Link>
              <Link href={`/${locale}/dashboard/preferences`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                <Briefcase className="w-6 h-6 text-green-600" />
                <span className="text-sm text-gray-700">{isEn ? "Preferences" : "求职偏好"}</span>
              </Link>
              <Link href={`/${locale}/dashboard/recommended`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-sm text-gray-700">{isEn ? "Recommended" : "推荐职位"}</span>
              </Link>
              <Link href={`/${locale}/dashboard/job-progress`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 transition">
                <BookOpen className="w-6 h-6 text-yellow-600" />
                <span className="text-sm text-gray-700">{isEn ? "Progress" : "投递进度"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
