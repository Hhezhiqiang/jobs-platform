"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WriteStoryPageProps {
  params: { locale: string };
}

const storyTypes = [
  { value: "EXPERIENCE", label: "💡 经验分享", desc: "分享你在职场中的宝贵经验和心得" },
  { value: "TRANSITION", label: "🔄 职业转型", desc: "记录你转换职业跑道的经历" },
  { value: "MILESTONE", label: "🏆 职业里程碑", desc: "庆祝你职业生涯中的重要成就" },
  { value: "CHALLENGE", label: "💪 挑战与成长", desc: "分享你如何克服困难的经历" },
  { value: "INSIGHT", label: "🔍 行业洞察", desc: "分享你对行业的观察和思考" },
];

export default function WriteStoryPage({ params }: WriteStoryPageProps) {
  const { locale } = params;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "EXPERIENCE",
    timeline: null as any,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // 验证
    if (formData.title.length < 5) {
      setError("标题至少需要5个字符");
      return;
    }
    if (formData.content.length < 100) {
      setError("内容至少需要100个字符");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push(`/${locale}/career-trail/${data.story.id}`);
      } else {
        setError(data.error || "发布失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/career-trail`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回职迹首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">✍️ 写故事</h1>
          <p className="text-gray-600 mt-2">分享你的职场经历，启发他人成长</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 标题 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              故事标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="给你的故事起一个吸引人的标题"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-sm text-gray-500 mt-1">{formData.title.length}/100 字符</p>
          </div>

          {/* 分类 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              故事类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {storyTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.value })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.type === t.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 正文 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              故事正文 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="详细描述你的职场故事...&#10;&#10;建议包含：&#10;- 背景情况&#10;- 具体经历&#10;- 遇到的挑战&#10;- 如何克服&#10;- 收获和感悟"
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              至少 100 字符，当前 {formData.content.length} 字符
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "发布中..." : "发布故事"}
            </button>
            <Link
              href={`/${locale}/career-trail`}
              className="px-8 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
