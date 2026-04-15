"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Eye, Clock, Building, Briefcase, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface InterviewExperienceCardProps {
  interview: {
    id: string;
    title: string;
    summary: string;
    content?: string;
    resonanceCount: number;
    viewCount: number;
    createdAt: string | Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    department?: string;
    position?: string;
    result?: "passed" | "failed" | "unknown";
    difficulty?: number;
    duration?: string;
    questions?: string[];
    tags?: string[];
  };
  locale: string;
  variant?: "default" | "compact";
}

/**
 * 面试结果标签组件
 */
function ResultBadge({ result }: { result?: "passed" | "failed" | "unknown" }) {
  switch (result) {
    case "passed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          已通过
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          未通过
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          结果未知
        </Badge>
      );
  }
}

/**
 * 难度评分组件
 */
function DifficultyRating({ level }: { level?: number }) {
  if (!level) return null;

  const colors = {
    1: "bg-green-400",
    2: "bg-green-500",
    3: "bg-yellow-400",
    4: "bg-orange-400",
    5: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">难度:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2 h-2 rounded-full ${
              star <= level ? colors[level as keyof typeof colors] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600">{level}/5</span>
    </div>
  );
}

/**
 * 面试经验卡片组件
 * 
 * 功能：
 * - 显示故事标题、作者、时间
 * - 显示「已通过/未通过」标签（从故事内容解析）
 * - 显示共鸣数
 * - 显示部门、岗位信息
 * - 显示难度评估
 * - 显示热门问题预览
 */
export function InterviewExperienceCard({
  interview,
  locale,
  variant = "default",
}: InterviewExperienceCardProps) {
  const createdAt =
    typeof interview.createdAt === "string"
      ? new Date(interview.createdAt)
      : interview.createdAt;

  const formattedDate = createdAt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (variant === "compact") {
    return (
      <Link
        href={`/${locale}/career-trail/${interview.id}`}
        className="group block bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {interview.author.avatar ? (
              <Image
                src={interview.author.avatar}
                alt={interview.author.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {interview.author.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ResultBadge result={interview.result} />
              {interview.difficulty && <DifficultyRating level={interview.difficulty} />}
            </div>

            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 mb-1 line-clamp-1">
              {interview.title}
            </h3>

            <p className="text-sm text-gray-500 line-clamp-1 mb-2">{interview.summary}</p>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{interview.author.name}</span>
              <span>·</span>
              <span>{formattedDate}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                {interview.resonanceCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/career-trail/${interview.id}`}
      className="group block bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        {/* 作者头像 */}
        <div className="flex-shrink-0">
          {interview.author.avatar ? (
            <Image
              src={interview.author.avatar}
              alt={interview.author.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {interview.author.name.charAt(0)}
            </div>
          )}
        </div>

        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部信息 */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <ResultBadge result={interview.result} />
            
            {interview.department && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {interview.department}
              </Badge>
            )}
            
            {interview.position && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {interview.position}
              </Badge>
            )}

            {interview.difficulty && <DifficultyRating level={interview.difficulty} />}
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-1">
            {interview.title}
          </h3>

          {/* 摘要 */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{interview.summary}</p>

          {/* 面试问题预览 */}
          {interview.questions && interview.questions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">面试问题：</p>
              <div className="flex flex-wrap gap-2">
                {interview.questions.slice(0, 3).map((question, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md line-clamp-1"
                  >
                    {question.length > 30 ? question.slice(0, 30) + "..." : question}
                  </span>
                ))}
                {interview.questions.length > 3 && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    +{interview.questions.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 标签 */}
          {interview.tags && interview.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {interview.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{interview.author.name}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {interview.duration && (
                <>
                  <span>·</span>
                  <span>⏱ {interview.duration}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {interview.viewCount}
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <ThumbsUp className="w-4 h-4" />
                {interview.resonanceCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * 面试经验卡片骨架屏
 */
export function InterviewExperienceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="w-16 h-5 bg-gray-200 rounded" />
            <div className="w-20 h-5 bg-gray-200 rounded" />
          </div>
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="flex gap-2 pt-2">
            <div className="w-24 h-6 bg-gray-200 rounded" />
            <div className="w-20 h-6 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
