"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface ApplyButtonProps {
  jobSlug: string;
  jobTitle: string;
  companyName: string;
}

export function ApplyButton({
  jobSlug,
}: ApplyButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const handleApply = () => {
    if (status === "authenticated") {
      router.push(`/${locale}/jobs/${jobSlug}/apply`);
    } else {
      router.push(`/${locale}/auth/register?callbackUrl=${encodeURIComponent(`/${locale}/jobs/${jobSlug}/apply`)}`);
    }
  };

  return (
    <button
      onClick={handleApply}
      className="w-full bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
    >
      {isEn ? "Apply Now" : "立即申请"}
    </button>
  );
}

export function ShareButton({ jobSlug, jobTitle, companyName }: { jobSlug: string; jobTitle: string; companyName: string }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${locale}/jobs/${jobSlug}`;
    const text = isEn
      ? `${jobTitle} at ${companyName} - Check out this job on JobQuip!`
      : `${companyName} - ${jobTitle} | 查看职位详情`;

    // 优先使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: shareUrl });
        return;
      } catch {
        // 用户取消或失败，降级到复制链接
      }
    }

    // 降级：复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 最后的降级方案：选中 URL 提示用户手动复制
      const temp = document.createElement("textarea");
      temp.value = shareUrl;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all flex items-center justify-center gap-2"
    >
      {copied
        ? (isEn ? "Copied!" : "已复制")
        : (<>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {isEn ? "Share" : "分享"}
          </>)}
    </button>
  );
}

export default ApplyButton;
