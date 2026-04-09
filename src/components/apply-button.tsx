"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ApplyModal from "./apply-modal";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applyUrl: string;
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

  return (
    <>
      <button
        onClick={handleApply}
        className="flex-1 bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
