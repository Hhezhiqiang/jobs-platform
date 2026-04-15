"use client";

import { useState, useEffect, useCallback } from "react";
import { X, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// 文化标签选项
export const CULTURE_TAGS = [
  { id: "flat-management", label: "扁平管理", icon: "🏢", description: "层级简单，沟通直接" },
  { id: "tech-driven", label: "技术驱动", icon: "💻", description: "重视技术创新，工程师文化" },
  { id: "growth-space", label: "成长空间", icon: "📈", description: "完善的晋升通道和培训体系" },
  { id: "work-life-balance", label: "工作生活平衡", icon: "⚖️", description: "不加班，弹性工作制" },
  { id: "stable", label: "工作稳定", icon: "🛡️", description: "业务稳健，抗风险能力强" },
  { id: "innovation", label: "创新氛围", icon: "💡", description: "鼓励创新，容错率高" },
  { id: "teamwork", label: "团队协作", icon: "🤝", description: "重视团队精神，互助文化" },
  { id: "remote-friendly", label: "远程友好", icon: "🏠", description: "支持远程办公或混合办公" },
  { id: "startup-vibe", label: "创业氛围", icon: "🚀", description: "快节奏，有期权激励" },
  { id: "diversity", label: "多元包容", icon: "🌍", description: "尊重差异，包容多元" },
  { id: "result-oriented", label: "结果导向", icon: "🎯", description: "以结果论英雄，不打卡" },
  { id: "learning-culture", label: "学习文化", icon: "📚", description: "鼓励学习，提供学习资源" },
] as const;

export type CultureTag = typeof CULTURE_TAGS[number]["id"];

// 本地存储键
const STORAGE_KEY = "job-preferences-v1";

export interface JobPreferences {
  cultureTags: CultureTag[];
  minMatchScore: number;
  sortBy: "date" | "match";
  onlyShowMatched: boolean;
}

const DEFAULT_PREFERENCES: JobPreferences = {
  cultureTags: [],
  minMatchScore: 50,
  sortBy: "date",
  onlyShowMatched: false,
};

// 获取存储的偏好设置
export function getStoredPreferences(): JobPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.error("Error reading preferences:", e);
  }
  return DEFAULT_PREFERENCES;
}

// 保存偏好设置到本地存储
export function savePreferences(preferences: JobPreferences): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error("Error saving preferences:", e);
  }
}

// 计算匹配度
export function calculateMatchScore(
  companyTags: string[],
  preferenceTags: CultureTag[]
): number {
  if (!preferenceTags.length || !companyTags.length) return 0;
  
  const matchingTags = companyTags.filter(tag => 
    preferenceTags.includes(tag as CultureTag)
  );
  
  // 计算匹配度：匹配标签数 / 用户偏好标签数 * 100
  return Math.round((matchingTags.length / preferenceTags.length) * 100);
}

// 获取匹配的标签
export function getMatchingTags(
  companyTags: string[],
  preferenceTags: CultureTag[]
): string[] {
  return companyTags.filter(tag => 
    preferenceTags.includes(tag as CultureTag)
  );
}

interface JobPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: JobPreferences) => void;
}

export function JobPreferenceModal({ isOpen, onClose, onSave }: JobPreferenceModalProps) {
  const [preferences, setPreferences] = useState<JobPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setPreferences(getStoredPreferences());
    }
  }, [isOpen]);

  const handleTagToggle = useCallback((tagId: CultureTag) => {
    setPreferences(prev => {
      const newTags = prev.cultureTags.includes(tagId)
        ? prev.cultureTags.filter(t => t !== tagId)
        : [...prev.cultureTags, tagId];
      return { ...prev, cultureTags: newTags };
    });
  }, []);

  const handleSave = useCallback(() => {
    savePreferences(preferences);
    onSave?.(preferences);
    onClose();
  }, [preferences, onSave, onClose]);

  const handleClear = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  if (!mounted || !isOpen) return null;

  const selectedCount = preferences.cultureTags.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">设置求职偏好</h2>
              <p className="text-sm text-gray-500">选择你期望的团队文化，获取更精准的职位推荐</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Selected Tags Summary */}
          {selectedCount > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  已选择 {selectedCount} 个偏好标签
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.cultureTags.map(tagId => {
                  const tag = CULTURE_TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 text-sm rounded-full border border-blue-200"
                    >
                      {tag.icon} {tag.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Tag Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              期望的团队文化（多选）
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CULTURE_TAGS.map(tag => {
                const isSelected = preferences.cultureTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{tag.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          isSelected ? "text-blue-900" : "text-gray-900"
                        )}>
                          {tag.label}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {tag.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Option */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              排序偏好
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPreferences(prev => ({ ...prev, sortBy: "date" }))}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                  preferences.sortBy === "date"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                📅 按发布时间
              </button>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, sortBy: "match" }))}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                  preferences.sortBy === "match"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                ✨ 按匹配度
              </button>
            </div>
          </div>

          {/* Only Show Matched Toggle */}
          <div className="mt-4">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.onlyShowMatched}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  onlyShowMatched: e.target.checked 
                }))}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">只显示文化契合的职位</p>
                <p className="text-sm text-gray-500">隐藏匹配度低于50%的职位</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            清除设置
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 偏好设置入口按钮组件
interface JobPreferenceButtonProps {
  onClick: () => void;
  hasPreferences: boolean;
  matchCount?: number;
}

export function JobPreferenceButton({ onClick, hasPreferences, matchCount }: JobPreferenceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
        hasPreferences
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
          : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>求职偏好</span>
      {hasPreferences && matchCount !== undefined && (
        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {matchCount}个契合
        </span>
      )}
      {hasPreferences && !matchCount && (
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )}
    </button>
  );
}
