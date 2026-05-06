"use client";

import { useState } from "react";
import { MessageCircle, Share2, Edit, Trash2, CheckCircle } from "lucide-react";

export function DemandActions({ id, isOwner }: { id: string; isOwner: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleContact = async () => {
    setLoading(true);
    // 模拟发送请求
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      alert("已发送联系意向！求职者收到通知后会尽快回复您。");
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "求职需求详情",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板！");
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleContact}
          disabled={loading}
          className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${
            loading
              ? "bg-gray-200 text-gray-400 cursor-wait"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : showSuccess ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
          {loading ? "发送中..." : showSuccess ? "已发送" : "立即联系"}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
        >
          <Share2 className="w-5 h-5" />
          分享
        </button>
      </div>

      {isOwner && (
        <div className="pt-6 border-t border-gray-100 flex justify-center gap-8">
          <button className="text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm font-medium">
            <Edit className="w-4 h-4" /> 编辑需求
          </button>
          <button className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium">
            <Trash2 className="w-4 h-4" /> 下架需求
          </button>
        </div>
      )}
    </div>
  );
}