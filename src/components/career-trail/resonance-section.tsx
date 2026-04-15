"use client";

import { useState } from "react";

interface ResonanceSectionProps {
  storyId: string;
  locale: string;
  hasResonated: boolean;
  totalCount: number;
}

export function ResonanceSection({
  storyId,
  hasResonated,
  totalCount,
}: ResonanceSectionProps) {
  const [resonated, setResonated] = useState(hasResonated);
  const [count, setCount] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleResonance = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/resonance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "added") {
          setResonated(true);
          setCount((c) => c + 1);
        } else {
          setResonated(false);
          setCount((c) => c - 1);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💙 共鸣 ({count})
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        这个故事触动了你吗？点击共鸣按钮表达你的感受。
      </p>

      <button
        onClick={handleResonance}
        disabled={isLoading}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          resonated
            ? "bg-pink-100 text-pink-600 border-2 border-pink-200"
            : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-pink-300"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="text-xl">{resonated ? "💖" : "🤍"}</span>
        <span>{resonated ? "已共鸣" : "共鸣"}</span>
      </button>
    </div>
  );
}
