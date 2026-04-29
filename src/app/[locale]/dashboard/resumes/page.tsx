"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, Star, Edit } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
}

export default function ResumesPage({ params }: { params: Promise<{ locale: string }> }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const [locale, setLocale] = useState("zh");
  const router = useRouter();

  useEffect(() => {
    params.then(p => setLocale(p.locale)).catch(() => {});
    fetchResumes();
  }, []);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.replace(/\.[^.]+$/, ""));

    try {
      const res = await fetch("/api/resumes/upload", { method: "POST", body: formData });
      if (res.ok) {
        fetchResumes();
      } else {
        const err = await res.json();
        alert(err.error || "上传失败");
      }
    } catch (e) {
      alert("上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const setDefault = async (id: string) => {
    try {
      await fetch(`/api/resumes/${id}`, { method: "PATCH", body: JSON.stringify({ isDefault: true }) });
      fetchResumes();
    } catch (e) {
      alert("设置失败");
    }
  };

  const deleteResume = async (id: string) => {
    if (!confirm(locale === "en" ? "Delete this resume?" : "确定删除这份简历吗？")) return;
    try {
      await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      fetchResumes();
    } catch (e) {
      alert("删除失败");
    }
  };

  const saveName = async (id: string) => {
    if (!newName.trim()) return;
    try {
      await fetch(`/api/resumes/${id}`, { method: "PATCH", body: JSON.stringify({ name: newName }) });
      setEditingName(null);
      fetchResumes();
    } catch (e) {
      alert("保存失败");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEn ? "My Resumes" : "我的简历"}</h1>
            <p className="text-gray-500 mt-1">{isEn ? "Upload and manage your resumes" : "上传和管理你的简历"}</p>
          </div>
          <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition">
            <Upload className="w-4 h-4" />
            {isEn ? "Upload" : "上传简历"}
            <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleUpload} className="hidden" />
          </label>
        </div>

        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700">{isEn ? "Uploading..." : "上传中..."}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">{isEn ? "Loading..." : "加载中..."}</div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{isEn ? "No resumes yet" : "还没有简历"}</h3>
            <p className="text-gray-500 mb-6">{isEn ? "Upload your resume to start applying for jobs" : "上传简历开始投递职位吧"}</p>
            <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
              <Upload className="w-4 h-4" />
              {isEn ? "Upload Resume" : "上传简历"}
              <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map(resume => (
              <div key={resume.id} className={`bg-white rounded-xl p-6 shadow-sm border ${resume.isDefault ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {editingName === resume.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                              autoFocus
                              onKeyDown={e => e.key === "Enter" && saveName(resume.id)}
                            />
                            <button onClick={() => saveName(resume.id)} className="text-blue-600 text-sm">{isEn ? "Save" : "保存"}</button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-gray-900 truncate">{resume.name}</h3>
                        )}
                        {resume.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                            {isEn ? "Default" : "默认"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {resume.fileType.split("/").pop()?.toUpperCase()} · {formatSize(resume.fileSize)} · {new Date(resume.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!resume.isDefault && (
                      <button onClick={() => setDefault(resume.id)} className="p-2 text-gray-400 hover:text-yellow-500 transition" title={isEn ? "Set as default" : "设为默认"}>
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => { setEditingName(resume.id); setNewName(resume.name); }} className="p-2 text-gray-400 hover:text-blue-600 transition" title={isEn ? "Rename" : "重命名"}>
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteResume(resume.id)} className="p-2 text-gray-400 hover:text-red-600 transition" title={isEn ? "Delete" : "删除"}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
