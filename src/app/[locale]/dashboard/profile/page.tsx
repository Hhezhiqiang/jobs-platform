"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ResumeUpload from "@/components/resume-upload";

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
}

interface UserProfile {
  gender?: string;
  birthday?: string;
  location?: string;
  bio?: string;
  skills: string[];
  workExperience: WorkExperience[];
  education: Education[];
}

interface Resume {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("basic");
  
  // 简历列表
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  
  // 基本信息
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  
  // 工作经历
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [workForm, setWorkForm] = useState<WorkExperience>({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
  
  // 教育背景
  const [education, setEducation] = useState<Education[]>([]);
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState<Education>({
    school: "",
    degree: "",
    major: "",
    startDate: "",
    endDate: "",
    current: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    
    if (status === "authenticated") {
      fetchProfile();
      fetchResumes();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      
      if (res.ok) {
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        
        if (data.profile) {
          setGender(data.profile.gender || "");
          setBirthday(data.profile.birthday ? data.profile.birthday.split("T")[0] : "");
          setLocation(data.profile.location || "");
          setBio(data.profile.bio || "");
          setSkills(data.profile.skills || []);
          setWorkExperience(data.profile.workExperience || []);
          setEducation(data.profile.education || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    setResumesLoading(true);
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      
      if (res.ok) {
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setResumesLoading(false);
    }
  };

  const handleResumeUploadSuccess = (resume: Resume) => {
    setResumes((prev) => [resume, ...prev]);
    setMessage({ type: "success", text: "简历上传成功" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleResumeDeleteSuccess = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    setMessage({ type: "success", text: "简历已删除" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSetDefaultSuccess = (id: string) => {
    setResumes((prev) =>
      prev.map((r) => ({
        ...r,
        isDefault: r.id === id,
      }))
    );
    setMessage({ type: "success", text: "默认简历已设置" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      
      if (res.ok) {
        setMessage({ type: "success", text: "基本信息保存成功" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败，请稍后重试" });
    } finally {
      setSaving(false);
    }
  };

  const saveDetailedProfile = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await fetch("/api/user/profile/detail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          birthday,
          location,
          bio,
          skills,
          workExperience,
          education,
        }),
      });
      
      if (res.ok) {
        setMessage({ type: "success", text: "详细资料保存成功" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败，请稍后重试" });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addWorkExperience = () => {
    if (workForm.company && workForm.position && workForm.startDate) {
      setWorkExperience([...workExperience, workForm]);
      setWorkForm({
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      });
      setShowWorkForm(false);
    }
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    if (eduForm.school && eduForm.degree && eduForm.startDate) {
      setEducation([...education, eduForm]);
      setEduForm({
        school: "",
        degree: "",
        major: "",
        startDate: "",
        endDate: "",
        current: false,
      });
      setShowEduForm(false);
    }
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white shadow-sm animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm h-64 animate-pulse" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-lg shadow-sm h-40 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-64 animate-pulse" />
              <div className="bg-white rounded-lg shadow-sm h-48 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← 返回首页
              </Link>
              <h1 className="text-2xl font-bold">个人资料</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">欢迎，{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 侧边导航 */}
          <div className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📊 概览
              </Link>
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
              >
                📄 我的简历
              </Link>
              <Link
                href="/dashboard/applications"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                📋 我的申请
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                ⚙️ 账号设置
              </Link>
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3">
            {message.text && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Tab 切换 */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("basic")}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === "basic"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  基本信息
                </button>
                <button
                  onClick={() => setActiveTab("experience")}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === "experience"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  工作经历
                </button>
                <button
                  onClick={() => setActiveTab("education")}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === "education"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  教育背景
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === "skills"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  技能标签
                </button>
                <button
                  onClick={() => setActiveTab("resumes")}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === "resumes"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  简历文件
                </button>
              </div>

              <div className="p-6">
                {/* 基本信息 */}
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          姓名
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          手机号
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          性别
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">请选择</option>
                          <option value="男">男</option>
                          <option value="女">女</option>
                          <option value="保密">保密</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          生日
                        </label>
                        <input
                          type="date"
                          value={birthday}
                          onChange={(e) => setBirthday(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          所在城市
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="如：北京、上海、深圳"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        自我介绍
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder="简要介绍自己..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={saveBasicInfo}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "保存基本信息"}
                      </button>
                      <button
                        onClick={saveDetailedProfile}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "保存详细资料"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 工作经历 */}
                {activeTab === "experience" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">工作经历</h3>
                      <button
                        onClick={() => setShowWorkForm(!showWorkForm)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        + 添加经历
                      </button>
                    </div>

                    {showWorkForm && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <input
                          type="text"
                          placeholder="公司名称"
                          value={workForm.company}
                          onChange={(e) =>
                            setWorkForm({ ...workForm, company: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="职位名称"
                          value={workForm.position}
                          onChange={(e) =>
                            setWorkForm({ ...workForm, position: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="date"
                            placeholder="开始时间"
                            value={workForm.startDate}
                            onChange={(e) =>
                              setWorkForm({ ...workForm, startDate: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                          {!workForm.current && (
                            <input
                              type="date"
                              placeholder="结束时间"
                              value={workForm.endDate}
                              onChange={(e) =>
                                setWorkForm({ ...workForm, endDate: e.target.value })
                              }
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          )}
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={workForm.current}
                            onChange={(e) =>
                              setWorkForm({ ...workForm, current: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm">当前在职</span>
                        </label>
                        <textarea
                          placeholder="工作内容描述"
                          value={workForm.description}
                          onChange={(e) =>
                            setWorkForm({ ...workForm, description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={addWorkExperience}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            添加
                          </button>
                          <button
                            onClick={() => setShowWorkForm(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {workExperience.map((work, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg flex justify-between items-start"
                        >
                          <div>
                            <p className="font-semibold">{work.position}</p>
                            <p className="text-gray-600">{work.company}</p>
                            <p className="text-sm text-gray-500">
                              {work.startDate} ~ {work.current ? "至今" : work.endDate}
                            </p>
                            {work.description && (
                              <p className="text-sm text-gray-600 mt-2">{work.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeWorkExperience(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                      {workExperience.length === 0 && (
                        <p className="text-gray-500 text-center py-8">暂无工作经历</p>
                      )}
                    </div>

                    <button
                      onClick={saveDetailedProfile}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存工作经历"}
                    </button>
                  </div>
                )}

                {/* 教育背景 */}
                {activeTab === "education" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">教育背景</h3>
                      <button
                        onClick={() => setShowEduForm(!showEduForm)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        + 添加学历
                      </button>
                    </div>

                    {showEduForm && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <input
                          type="text"
                          placeholder="学校名称"
                          value={eduForm.school}
                          onChange={(e) =>
                            setEduForm({ ...eduForm, school: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="专业"
                          value={eduForm.major}
                          onChange={(e) =>
                            setEduForm({ ...eduForm, major: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <select
                          value={eduForm.degree}
                          onChange={(e) =>
                            setEduForm({ ...eduForm, degree: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">选择学历</option>
                          <option value="高中">高中</option>
                          <option value="大专">大专</option>
                          <option value="本科">本科</option>
                          <option value="硕士">硕士</option>
                          <option value="博士">博士</option>
                          <option value="其他">其他</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="date"
                            placeholder="开始时间"
                            value={eduForm.startDate}
                            onChange={(e) =>
                              setEduForm({ ...eduForm, startDate: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                          {!eduForm.current && (
                            <input
                              type="date"
                              placeholder="结束时间"
                              value={eduForm.endDate}
                              onChange={(e) =>
                                setEduForm({ ...eduForm, endDate: e.target.value })
                              }
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          )}
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={eduForm.current}
                            onChange={(e) =>
                              setEduForm({ ...eduForm, current: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm">在读</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={addEducation}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            添加
                          </button>
                          <button
                            onClick={() => setShowEduForm(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg flex justify-between items-start"
                        >
                          <div>
                            <p className="font-semibold">{edu.school}</p>
                            <p className="text-gray-600">
                              {edu.degree} · {edu.major}
                            </p>
                            <p className="text-sm text-gray-500">
                              {edu.startDate} ~ {edu.current ? "至今" : edu.endDate}
                            </p>
                          </div>
                          <button
                            onClick={() => removeEducation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                      {education.length === 0 && (
                        <p className="text-gray-500 text-center py-8">暂无教育背景</p>
                      )}
                    </div>

                    <button
                      onClick={saveDetailedProfile}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存教育背景"}
                    </button>
                  </div>
                )}

                {/* 技能标签 */}
                {activeTab === "skills" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        添加技能
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="输入技能名称，如：React、Java、项目管理"
                          onKeyPress={(e) => e.key === "Enter" && addSkill()}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={addSkill}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          添加
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {skills.length === 0 && (
                        <p className="text-gray-500">暂无技能标签，请添加</p>
                      )}
                    </div>

                    <button
                      onClick={saveDetailedProfile}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存技能标签"}
                    </button>
                  </div>
                )}

                {/* 简历文件管理 */}
                {activeTab === "resumes" && (
                  <div className="space-y-6">
                    {resumesLoading ? (
                      <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : (
                      <ResumeUpload
                        resumes={resumes}
                        onUploadSuccess={handleResumeUploadSuccess}
                        onDeleteSuccess={handleResumeDeleteSuccess}
                        onSetDefaultSuccess={handleSetDefaultSuccess}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
