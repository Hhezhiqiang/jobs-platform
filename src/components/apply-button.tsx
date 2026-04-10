"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ApplyModal from "./apply-modal";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applyUrl?: string; // 可选，未登录时不传递
}

export function ApplyButton({
  jobId,
  jobTitle,
  companyName,
  applyUrl,
}: ApplyButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setShowModal(true);
  };

  const handleSuccess = () => {
    setApplied(true);
    setShowModal(false);
  };

  // 未登录状态
  if (!session) {
    return (
      <button
        onClick={handleApply}
        className="w-full bg-gray-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
      >
        🔒 登录后查看申请方式
      </button>
    );
  }

  // 已申请状态
  if (applied) {
    return (
      <div className="flex-1 text-center">
        <div className="bg-green-100 text-green-800 py-4 rounded-lg font-semibold">
          ✅ 已申请
        </div>
        <p className="text-sm text-gray-500 mt-2">
          您可以在「个人中心 - 我的申请」中查看申请状态
        </p>
      </div>
    );
  }

  // 有外部申请链接时显示"前往申请"
  if (applyUrl) {
    return (
      <>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          前往申请 ↗
        </a>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center mb-3">
            或者通过本平台申请
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-white border-2 border-blue-600 text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            通过平台申请
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

  // 仅平台申请
  return (
    <>
      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        立即申请
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
