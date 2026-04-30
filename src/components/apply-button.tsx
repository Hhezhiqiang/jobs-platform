"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import ApplyModal from "./apply-modal";
import { ensureHttpProtocol } from "@/lib/utils";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applyUrl?: string;
}

export function ApplyButton({
  jobId,
  jobTitle,
  companyName,
  applyUrl,
}: ApplyButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";
  const t = useTranslations("applyButton");
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setShowModal(true);
  };

  const handleSuccess = async () => {
    setApplied(true);
    setShowModal(false);
    try {
      await fetch("/api/game/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "APPLY_JOB", jobId }),
      });
    } catch (error) {
      console.error("Failed to track application:", error);
    }
  };

  if (applied) {
    return (
      <div className="flex-1 text-center">
        <div className="bg-green-100 text-green-800 py-4 rounded-lg font-semibold">
          ✅ {isEn ? "Applied" : "已申请"}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {session
            ? (isEn ? "You can check status in Dashboard - My Applications" : "您可以在「个人中心 - 我的申请」中查看申请状态")
            : (isEn ? "Create an account to track your applications" : "注册账号后可以追踪申请进度")}
        </p>
        {!session && (
          <button
            onClick={() => router.push(`/${locale}/auth/register`)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {isEn ? "Register Now →" : "立即注册 →"}
          </button>
        )}
      </div>
    );
  }

  if (applyUrl) {
    return (
      <>
        <a
          href={ensureHttpProtocol(applyUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {isEn ? "Apply on External Site ↗" : "前往申请 ↗"}
        </a>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center mb-3">
            {isEn ? "Or apply through our platform" : "或者通过本平台申请"}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-white border-2 border-blue-600 text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {isEn ? "Apply via Platform" : "通过平台申请"}
          </button>
        </div>

        {showModal && (
          <ApplyModal
            jobId={jobId}
            jobTitle={jobTitle}
            companyName={companyName}
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        {isEn ? "Apply Now" : "立即申请"}
      </button>

      {showModal && (
        <ApplyModal
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

export default ApplyButton;
