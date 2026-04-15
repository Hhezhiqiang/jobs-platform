"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCultureMatch } from "@/hooks/use-culture-match";

// 预定义的文化标签选项
const PREDEFINED_CULTURE_TAGS = [
  "扁平管理",
  "技术驱动",
  "弹性工作",
  "远程友好",
  "快速成长",
  "大厂背景",
  "国际化",
  "初创氛围",
  "高薪",
  "股票期权",
  "带薪年假",
  "五险一金",
  "免费三餐",
  "健身房",
  "培训机会",
  "晋升透明",
  "开放沟通",
  "结果导向",
  "工作生活平衡",
  "创新文化",
];

// 工作地点选项
const LOCATION_OPTIONS = [
  "北京",
  "上海",
  "深圳",
  "广州",
  "杭州",
  "成都",
  "武汉",
  "西安",
  "南京",
  "苏州",
  "重庆",
  "天津",
];

// 工作类型选项
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "全职" },
  { value: "PART_TIME", label: "兼职" },
  { value: "CONTRACT", label: "合同制" },
  { value: "INTERNSHIP", label: "实习" },
  { value: "FREELANCE", label: "自由职业" },
];

// 经验级别选项
const EXPERIENCE_OPTIONS = [
  { value: "ENTRY", label: "应届生/初级" },
  { value: "MID", label: "中级（1-3年）" },
  { value: "SENIOR", label: "高级（3-5年）" },
  { value: "EXECUTIVE", label: "资深/管理（5年+）" },
];

// 远程偏好选项
const REMOTE_OPTIONS = [
  { value: "ANY", label: "不限" },
  { value: "FULL_REMOTE", label: "完全远程" },
  { value: "HYBRID", label: "混合办公" },
  { value: "ONSITE", label: "现场办公" },
];

interface JobPreferencesFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * 求职偏好设置表单
 * 
 * 允许用户设置：
 * - 期望的公司文化标签
 * - 薪资范围
 * - 工作地点
 * - 工作类型
 * - 经验级别
 * - 远程偏好
 */
export function JobPreferencesForm({
  onSave,
  onCancel,
}: JobPreferencesFormProps) {
  const { preferences, isLoading, updatePreferences, fetchPreferences } =
    useCultureMatch();

  // 表单状态
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<
    string[]
  >([]);
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [selectedRemote, setSelectedRemote] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (preferences) {
      setSelectedTags(preferences.cultureTags || []);
      setSalaryMin(preferences.salaryMin?.toString() || "");
      setSalaryMax(preferences.salaryMax?.toString() || "");
      setSelectedLocations(preferences.locations || []);
      setSelectedEmploymentTypes(preferences.employmentTypes || []);
      setSelectedExperience(preferences.experienceLevel || "");
      setSelectedRemote(preferences.remotePreference || "");
    }
  }, [preferences]);

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 添加自定义标签
  const addCustomTag = () => {
    if (
      customTag.trim() &&
      !selectedTags.includes(customTag.trim()) &&
      selectedTags.length < 10
    ) {
      setSelectedTags((prev) => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

  // 移除标签
  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  // 切换地点选择
  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  // 切换工作类型选择
  const toggleEmploymentType = (type: string) => {
    setSelectedEmploymentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // 保存表单
  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    // 验证薪资范围
    const min = salaryMin ? parseInt(salaryMin) : null;
    const max = salaryMax ? parseInt(salaryMax) : null;

    if (min !== null && max !== null && min > max) {
      setSaveError("最低薪资不能高于最高薪资");
      setIsSaving(false);
      return;
    }

    const success = await updatePreferences({
      cultureTags: selectedTags,
      salaryMin: min,
      salaryMax: max,
      locations: selectedLocations,
      employmentTypes: selectedEmploymentTypes,
      experienceLevel: selectedExperience || null,
      remotePreference: selectedRemote || null,
    });

    setIsSaving(false);

    if (success) {
      onSave?.();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-2xl">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">求职偏好设置</h2>
        <p className="text-white/80 text-sm mt-1">
          设置您的期望，我们将为您推荐最匹配的职位
        </p>
      </div>

      {/* 表单内容 */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* 文化标签选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            期望的公司文化
            <span className="text-gray-400 font-normal ml-1">
              （最多选10个）
            </span>
          </label>

          {/* 已选标签 */}
          <AnimatePresence>
            {selectedTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-3"
              >
                {selectedTags.map((tag) => (
                  <motion.span
                    key={tag}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-blue-200 rounded p-0.5 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 预定义标签 */}
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_CULTURE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={
                  !selectedTags.includes(tag) && selectedTags.length >= 10
                }
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500 text-white"
                      : selectedTags.length >= 10
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 自定义标签 */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              placeholder="添加自定义标签"
              maxLength={20}
              disabled={selectedTags.length >= 10}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={addCustomTag}
              disabled={!customTag.trim() || selectedTags.length >= 10}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              添加
            </button>
          </div>
        </div>

        {/* 薪资范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            期望薪资范围（年薪，千元）
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="最低"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="flex-1">
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="最高"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-500 text-sm">K</span>
          </div>
        </div>

        {/* 工作地点 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            期望工作地点
          </label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((location) => (
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${
                    selectedLocations.includes(location)
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* 工作类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            期望工作类型
          </label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleEmploymentType(option.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${
                    selectedEmploymentTypes.includes(option.value)
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 经验级别 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            经验级别
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedExperience(
                    selectedExperience === option.value ? "" : option.value
                  )
                }
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${
                    selectedExperience === option.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 远程偏好 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            远程工作偏好
          </label>
          <div className="flex flex-wrap gap-2">
            {REMOTE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedRemote(
                    selectedRemote === option.value ? "" : option.value
                  )
                }
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${
                    selectedRemote === option.value
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {saveError}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isSaving ? "保存中..." : "保存偏好"}
        </button>
      </div>
    </div>
  );
}

export default JobPreferencesForm;
