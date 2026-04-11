"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X, Check, Star, Trash2, Download, Loader2 } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
}

interface ResumeUploadProps {
  resumes: Resume[];
  onUploadSuccess: (resume: Resume) => void;
  onDeleteSuccess: (id: string) => void;
  onSetDefaultSuccess: (id: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const FILE_TYPE_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

export default function ResumeUpload({
  resumes,
  onUploadSuccess,
  onDeleteSuccess,
  onSetDefaultSuccess,
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "仅支持 PDF、DOC、DOCX 格式的文件";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "文件大小不能超过 10MB";
    }
    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    try {
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data.resume);
      } else {
        setUploadError(data.error || "上传失败");
      }
    } catch (error) {
      setUploadError("上传失败，请稍后重试");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这份简历吗？")) return;

    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleteSuccess(id);
      } else {
        alert("删除失败，请稍后重试");
      }
    } catch (error) {
      alert("删除失败，请稍后重试");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        onSetDefaultSuccess(id);
      } else {
        alert("设置默认简历失败");
      }
    } catch (error) {
      alert("设置默认简历失败");
    }
  };

  const handleDownload = (resume: Resume) => {
    const link = document.createElement("a");
    link.href = resume.fileUrl;
    link.download = resume.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-600">上传中...{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className={`w-12 h-12 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
            <div>
              <p className="text-gray-700 font-medium">点击或拖拽上传简历</p>
              <p className="text-gray-500 text-sm mt-1">支持 PDF、DOC、DOCX 格式，最大 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {uploadError && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {uploadError}
        </div>
      )}

      {/* 简历列表 */}
      {resumes.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
            <h3 className="font-medium text-gray-900">已上传的简历 ({resumes.length})</h3>
          </div>
          <div className="divide-y">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`p-4 flex items-center justify-between ${
                  resume.isDefault ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <File className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{resume.name}</p>
                      {resume.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                          <Check className="w-3 h-3" />
                          默认
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {FILE_TYPE_NAMES[resume.fileType] || "未知格式"} ·{" "}
                      {formatFileSize(resume.fileSize)} · {formatDate(resume.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!resume.isDefault && (
                    <button
                      onClick={() => handleSetDefault(resume.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="设为默认"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(resume)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="下载"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {resumes.length === 0 && !isUploading && (
        <div className="text-center py-8 text-gray-500">
          <p>暂无简历，请上传您的第一份简历</p>
        </div>
      )}
    </div>
  );
}
