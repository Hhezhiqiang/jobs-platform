"use client";

import { useState, useEffect, useCallback } from "react";
import { X, SlidersHorizontal, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// 文化标签选项（双语）
export const CULTURE_TAGS = [
  { id: "flat-management", icon: "🏢", label: { zh: "扁平管理", en: "Flat Structure" }, description: { zh: "层级简单，沟通直接", en: "Simple hierarchy, direct communication" } },
  { id: "tech-driven", icon: "💻", label: { zh: "技术驱动", en: "Tech-Driven" }, description: { zh: "重视技术创新，工程师文化", en: "Values technical innovation, engineer culture" } },
  { id: "growth-space", icon: "📈", label: { zh: "成长空间", en: "Growth" }, description: { zh: "完善的晋升通道和培训体系", en: "Clear promotion paths and training programs" } },
  { id: "work-life-balance", icon: "⚖️", label: { zh: "工作生活平衡", en: "Work-Life Balance" }, description: { zh: "不加班，弹性工作制", en: "No overtime, flexible hours" } },
  { id: "stable", icon: "🛡️", label: { zh: "工作稳定", en: "Stability" }, description: { zh: "业务稳健，抗风险能力强", en: "Stable business, strong risk resistance" } },
  { id: "innovation", icon: "💡", label: { zh: "创新氛围", en: "Innovation" }, description: { zh: "鼓励创新，容错率高", en: "Encourages innovation, high tolerance for failure" } },
  { id: "teamwork", icon: "🤝", label: { zh: "团队协作", en: "Teamwork" }, description: { zh: "重视团队精神，互助文化", en: "Team spirit, collaborative culture" } },
  { id: "remote-friendly", icon: "🏠", label: { zh: "远程友好", en: "Remote-Friendly" }, description: { zh: "支持远程办公或混合办公", en: "Supports remote or hybrid work" } },
  { id: "startup-vibe", icon: "🚀", label: { zh: "创业氛围", en: "Startup Vibe" }, description: { zh: "快节奏，有期权激励", en: "Fast-paced, equity incentives" } },
  { id: "diversity", icon: "🌍", label: { zh: "多元包容", en: "Diversity" }, description: { zh: "尊重差异，包容多元", en: "Respects differences, embraces diversity" } },
  { id: "result-oriented", icon: "🎯", label: { zh: "结果导向", en: "Results-Driven" }, description: { zh: "以结果论英雄，不打卡", en: "Results matter, no clock-punching" } },
  { id: "learning-culture", icon: "📚", label: { zh: "学习文化", en: "Learning Culture" }, description: { zh: "鼓励学习，提供学习资源", en: "Encourages learning, provides resources" } },
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

// Get localized culture tag data
export function getCultureTag(tagId: CultureTag, isEn: boolean) {
  const tag = CULTURE_TAGS.find(t => t.id === tagId);
  if (!tag) return null;
  return {
    ...tag,
    label: isEn ? tag.label.en : tag.label.zh,
    description: isEn ? tag.description.en : tag.description.zh,
  };
}

interface JobPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: JobPreferences) => void;
}

export function JobPreferenceModal({ isOpen, onClose, onSave }: JobPreferenceModalProps) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const [preferences, setPreferences] = useState<JobPreferences>(DEFAULT_PREFERENCES);
  const mounted = typeof window !== "undefined";

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
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
              <h2 className="text-lg font-bold text-gray-900">
                {isEn ? "Set Job Preferences" : "设置求职偏好"}
              </h2>
              <p className="text-sm text-gray-500">
                {isEn
                  ? "Select your desired team culture for more accurate recommendations"
                  : "选择你期望的团队文化，获取更精准的职位推荐"}
              </p>
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
                  {isEn
                    ? `${selectedCount} preferences selected`
                    : `已选择 ${selectedCount} 个偏好标签`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.cultureTags.map(tagId => {
                  const tag = getCultureTag(tagId, isEn);
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
              {isEn ? "Desired Team Culture (Multiple)" : "期望的团队文化（多选）"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CULTURE_TAGS.map(tag => {
                const localized = getCultureTag(tag.id, isEn);
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
                          {localized?.label}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {localized?.description}
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
              {isEn ? "Sort Preference" : "排序偏好"}
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
                {isEn ? "📅 By Date" : "📅 按发布时间"}
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
                {isEn ? "✨ By Match" : "✨ 按匹配度"}
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
                <p className="font-medium text-gray-900">
                  {isEn ? "Show culture-matched jobs only" : "只显示文化契合的职位"}
                </p>
                <p className="text-sm text-gray-500">
                  {isEn ? "Hide jobs with less than 50% match" : "隐藏匹配度低于50%的职位"}
                </p>
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
            {isEn ? "Clear" : "清除设置"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isEn ? "Cancel" : "取消"}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isEn ? "Save" : "保存设置"}
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
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

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
      <span>{isEn ? "Preferences" : "求职偏好"}</span>
      {hasPreferences && matchCount !== undefined && (
        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {matchCount}{isEn ? " matched" : "个契合"}
        </span>
      )}
      {hasPreferences && !matchCount && (
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )}
    </button>
  );
}
