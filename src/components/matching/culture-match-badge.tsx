"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchDetail {
  tagName: string;
  voteCount: number;
  weight: number;
}

interface CultureMatchData {
  score: number;
  isCultureFit: boolean;
  level: string;
  color: string;
  matchedTags: MatchDetail[];
}

interface CultureMatchBadgeProps {
  cultureMatch: CultureMatchData | null;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

/**
 * 文化匹配度徽章组件
 * 
 * 功能：
 * - 显示匹配度百分比
 * - 高匹配度(>80%)显示特殊样式
 * - 悬停显示匹配详情（哪些标签匹配）
 */
export function CultureMatchBadge({
  cultureMatch,
  size = "md",
  showTooltip = true,
}: CultureMatchBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 如果没有匹配数据，不显示
  if (!cultureMatch) {
    return null;
  }

  const { score, isCultureFit, level, color, matchedTags } = cultureMatch;

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: "px-2 py-0.5 text-xs",
      score: "text-sm font-bold",
      icon: 14,
      tooltipWidth: 240,
    },
    md: {
      container: "px-3 py-1 text-sm",
      score: "text-base font-bold",
      icon: 16,
      tooltipWidth: 280,
    },
    lg: {
      container: "px-4 py-1.5 text-base",
      score: "text-lg font-bold",
      icon: 20,
      tooltipWidth: 320,
    },
  };

  const config = sizeConfig[size];

  // 获取匹配度进度条颜色
  const getProgressColor = (score: number): string => {
    if (score >= 90) return "from-green-400 to-green-500";
    if (score >= 80) return "from-blue-400 to-blue-500";
    if (score >= 60) return "from-yellow-400 to-yellow-500";
    return "from-gray-400 to-gray-500";
  };

  // 获取匹配度背景样式
  const getBadgeStyle = (score: number, isCultureFit: boolean) => {
    if (isCultureFit) {
      return {
        background: `linear-gradient(135deg, ${color}15, ${color}25)`,
        borderColor: `${color}40`,
        color: color,
      };
    }
    return {
      background: "rgba(107, 114, 128, 0.1)",
      borderColor: "rgba(107, 114, 128, 0.2)",
      color: "#6b7280",
    };
  };

  const badgeStyle = getBadgeStyle(score, isCultureFit);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 徽章主体 */}
      <motion.div
        className={`
          inline-flex items-center gap-1.5 rounded-full border
          ${config.container}
          cursor-pointer transition-all duration-200
        `}
        style={badgeStyle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 高匹配度标识 */}
        {isCultureFit && (
          <motion.svg
            width={config.icon}
            height={config.icon}
            viewBox="0 0 24 24"
            fill="none"
            initial={{ rotate: 0 }}
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <path
              d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z"
              fill={color}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}

        {/* 匹配度分数 */}
        <span className={config.score}>{score}%</span>

        {/* 匹配等级标签 */}
        <span className="opacity-80">{level}</span>

        {/* 提示图标 */}
        {showTooltip && (
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        )}
      </motion.div>

      {/* 悬停提示框 */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2"
            style={{ width: config.tooltipWidth }}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* 头部 */}
              <div
                className="px-4 py-3 text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">文化匹配详情</span>
                  <span className="text-2xl font-bold">{score}%</span>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-4">
                {/* 进度条 */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getProgressColor(score)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                </div>

                {/* 匹配标签列表 */}
                {matchedTags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      匹配的文化标签：
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedTags.map((tag, index) => (
                        <motion.span
                          key={tag.tagName}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {tag.tagName}
                          {tag.voteCount > 1 && (
                            <span className="text-green-600/70">
                              ({tag.voteCount}人认同)
                            </span>
                          )}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 说明文字 */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isCultureFit
                    ? "✨ 这家公司与您期望的工作文化高度契合！"
                    : score >= 60
                    ? "👍 这家公司的文化与您的期望有一定匹配度。"
                    : "💡 这家公司的文化与您的期望存在差异。"}
                </p>
              </div>
            </div>

            {/* 箭头 */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"
              style={{ marginTop: "1px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 简化版文化匹配度显示（用于列表）
 */
export function CultureMatchBadgeMinimal({
  cultureMatch,
}: {
  cultureMatch: CultureMatchData | null;
}) {
  if (!cultureMatch) {
    return null;
  }

  const { score, isCultureFit, level, color } = cultureMatch;

  if (isCultureFit) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: `${color}15`,
          color: color,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
        </svg>
        文化契合
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
      {score}% 匹配
    </span>
  );
}

/**
 * 文化匹配度对比卡片（用于职位详情页）
 */
export function CultureMatchCard({
  userTags,
  companyTags,
  cultureMatch,
}: {
  userTags: string[];
  companyTags: { tagName: string; voteCount: number }[];
  cultureMatch: CultureMatchData | null;
}) {
  if (!cultureMatch) {
    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <p className="text-gray-500 text-center">
          设置您的求职偏好，查看文化匹配度
        </p>
      </div>
    );
  }

  const { score, isCultureFit, level, color, matchedTags } = cultureMatch;

  // 找出未匹配的用户标签
  const matchedTagNames = new Set(matchedTags.map((t) => t.tagName));
  const unmatchedUserTags = userTags.filter((t) => !matchedTagNames.has(t));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div
        className="px-6 py-4 text-white flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        <div className="flex items-center gap-2">
          {isCultureFit && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
            </svg>
          )}
          <span className="font-semibold text-lg">文化匹配度</span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{score}%</div>
          <div className="text-sm opacity-90">{level}</div>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-6 space-y-4">
        {/* 进度条 */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {/* 匹配的标签 */}
        {matchedTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              匹配的文化标签
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedTags.map((tag) => (
                <span
                  key={tag.tagName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {tag.tagName}
                  <span className="text-xs text-green-600/60">
                    {tag.voteCount}人认同
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 未匹配的标签 */}
        {unmatchedUserTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">未匹配的标签</h4>
            <div className="flex flex-wrap gap-2">
              {unmatchedUserTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 text-sm rounded-lg border border-gray-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 说明 */}
        <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">
          {isCultureFit
            ? "🎉 这家公司与您期望的工作文化高度契合，值得重点关注！"
            : score >= 60
            ? "👍 这家公司的文化与您的期望有一定匹配度，可以考虑申请。"
            : "💡 这家公司的文化与您的期望存在差异，请谨慎评估。"}
        </p>
      </div>
    </div>
  );
}

export default CultureMatchBadge;
