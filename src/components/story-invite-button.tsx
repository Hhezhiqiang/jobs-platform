"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

interface StoryInviteButtonProps {
  storyId: string;
  companyName: string;
  locale: string;
}

export function StoryInviteButton({ storyId, companyName, locale }: StoryInviteButtonProps) {
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    setSuccess(false);

    try {
      const response = await fetch(`/api/stories/${storyId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `您好！我们是 ${companyName} 的HR团队，看到您在职业故事中分享了精彩的经历，觉得您的背景与我们的团队非常匹配。诚邀您考虑加入我们的团队！`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        alert(data.error || "发送邀请失败");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setInviting(false);
    }
  };

  if (success) {
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        邀请已发送
      </span>
    );
  }

  return (
    <button
      onClick={handleInvite}
      disabled={inviting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {inviting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          发送中...
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          一键邀请投递
        </>
      )}
    </button>
  );
}
