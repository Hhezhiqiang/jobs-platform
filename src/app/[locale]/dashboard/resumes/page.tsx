"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileText, Upload, Trash2, Star, Edit } from "lucide-react";
import { logger } from '@/lib/logger';

interface Resume {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
}

export default function ResumesPage() {
  const t = useTranslations("dashboard.resumesPage");
  const tActions = useTranslations("dashboard.resumesPage.actions");

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
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
      logger.error(e);
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
        alert(err.error || t("uploadFailed"));
      }
    } catch (e) {
      alert(t("uploadFailed"));
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
      alert(t("setDefaultFailed"));
    }
  };

  const deleteResume = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      fetchResumes();
    } catch (e) {
      alert(t("deleteFailed"));
    }
  };

  const saveName = async (id: string) => {
    if (!newName.trim()) return;
    try {
      await fetch(`/api/resumes/${id}`, { method: "PATCH", body: JSON.stringify({ name: newName }) });
      setEditingName(null);
      fetchResumes();
    } catch (e) {
      alert(t("saveFailed"));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition">
            <Upload className="w-4 h-4" />
            {t("uploadShort")}
            <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleUpload} className="hidden" />
          </label>
        </div>

        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700">{t("uploading")}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t("loading")}</div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty.title")}</h3>
            <p className="text-gray-500 mb-6">{t("empty.subtitle")}</p>
            <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
              <Upload className="w-4 h-4" />
              {t("upload")}
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
                            <button onClick={() => saveName(resume.id)} className="text-blue-600 text-sm">{tActions("save")}</button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-gray-900 truncate">{resume.name}</h3>
                        )}
                        {resume.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                            {t("defaultBadge")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {resume.fileType.split("/").pop()?.toUpperCase()} · {formatSize(resume.fileSize)} · {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!resume.isDefault && (
                      <button onClick={() => setDefault(resume.id)} className="p-2 text-gray-400 hover:text-yellow-500 transition" title={tActions("setDefault")}>
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => { setEditingName(resume.id); setNewName(resume.name); }} className="p-2 text-gray-400 hover:text-blue-600 transition" title={tActions("rename")}>
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteResume(resume.id)} className="p-2 text-gray-400 hover:text-red-600 transition" title={tActions("delete")}>
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
