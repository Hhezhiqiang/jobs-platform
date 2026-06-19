"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Send, X, CheckSquare, Square } from "lucide-react";

interface BatchApplyBarProps {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export function BatchApplyBar({ selectedIds, onClear, onSuccess }: BatchApplyBarProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleSubmit = async () => {
    if (!session && !email) { setError("请填写邮箱"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/jobs/batch-apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedIds, coverLetter, email: email || undefined, name: name || undefined }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); onSuccess(); } else { setError(data.error || "申请失败"); }
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">已选 {selectedIds.length} 个岗位</span>
            <button onClick={onClear} className="text-sm text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /> 清除</button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Send className="w-4 h-4" /> 一键申请 ({selectedIds.length})
          </button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold mb-4">一键申请 {selectedIds.length} 个岗位</h3>
            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckSquare className="w-7 h-7 text-green-600" /></div>
                <p className="text-gray-900 font-medium">申请已提交！</p>
                <button onClick={() => { setShowModal(false); onClear(); }} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm">关闭</button>
              </div>
            ) : (
              <div className="space-y-3">
                {!session && (<><input type="email" placeholder="你的邮箱 *" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /><input type="text" placeholder="你的姓名" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></>)}
                <textarea placeholder="求职信（可选）" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-sm">取消</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{loading ? "提交中..." : "确认申请"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function JobCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="p-1">
      {checked ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-300" />}
    </button>
  );
}