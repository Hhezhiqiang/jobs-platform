"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Send } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SalarySubmitPage() {
  const t = useTranslations("salarySubmit");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const [form, setForm] = useState({
    jobTitle: "", company: "", city: "", industry: "互联网",
    salaryMin: "", salaryMax: "", experience: "MID", bonus: "",
    isAnonymous: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobTitle || !form.company || !form.city || !form.salaryMin || !form.salaryMax) {
      setError(isEn ? "Please fill in all required fields" : "请填写所有必填项");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/salary/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/salary-insights`), 2000);
      } else {
        setError(data.error || (isEn ? "Submit failed" : "提交失败"));
      }
    } catch {
      setError(isEn ? "Network error" : "网络错误");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{isEn ? "Submitted!" : "提交成功！"}</h2>
          <p className="text-gray-500">{isEn ? "Thank you for sharing your salary info." : "感谢分享你的薪资信息。"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/${locale}/salary-insights`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> {isEn ? "Back to Salary Insights" : "返回薪资洞察"}
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEn ? "Submit Salary" : "提交薪资"}</h1>
          <p className="text-gray-500 mb-6">{isEn ? "Share your salary anonymously to help the community." : "匿名分享你的薪资，帮助社区。"}</p>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Job Title *" : "职位名称 *"}</label>
                <input type="text" value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isEn ? "e.g. Frontend Engineer" : "如：前端工程师"} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Company *" : "公司 *"}</label>
                <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isEn ? "e.g. ByteDance" : "如：字节跳动"} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "City *" : "城市 *"}</label>
                <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isEn ? "e.g. Beijing" : "如：北京"} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Industry" : "行业"}</label>
                <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="互联网">{isEn ? "Internet" : "互联网"}</option>
                  <option value="金融">{isEn ? "Finance" : "金融"}</option>
                  <option value="区块链/Web3">{isEn ? "Blockchain/Web3" : "区块链/Web3"}</option>
                  <option value="电商">{isEn ? "E-commerce" : "电商"}</option>
                  <option value="硬件">{isEn ? "Hardware" : "硬件"}</option>
                  <option value="游戏">{isEn ? "Gaming" : "游戏"}</option>
                  <option value="AI">{isEn ? "AI" : "AI"}</option>
                  <option value="其他">{isEn ? "Other" : "其他"}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Experience Level" : "经验级别"}</label>
              <div className="flex gap-2 flex-wrap">
                {[{v:"ENTRY",z:"应届/入门",e:"Entry"},{v:"MID",z:"中级(1-3年)",e:"Mid (1-3y)"},{v:"SENIOR",z:"高级(3-5年)",e:"Senior (3-5y)"},{v:"EXPERT",z:"专家(5年+)",e:"Expert (5y+)"}].map(exp => (
                  <button key={exp.v} type="button"
                    onClick={() => setForm({...form, experience: exp.v})}
                    className={`px-3 py-2 rounded-xl text-sm transition ${form.experience === exp.v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {isEn ? exp.e : exp.z}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Min Salary (K/month) *" : "最低月薪 (K) *"}</label>
                <input type="number" value={form.salaryMin} onChange={e => setForm({...form, salaryMin: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Max Salary (K/month) *" : "最高月薪 (K) *"}</label>
                <input type="number" value={form.salaryMax} onChange={e => setForm({...form, salaryMax: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="35" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isEn ? "Annual Bonus (K, optional)" : "年终奖 (K，可选)"}</label>
              <input type="number" value={form.bonus} onChange={e => setForm({...form, bonus: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isEn ? "e.g. 30" : "如：30"} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-600">{isEn ? "Submit anonymously" : "匿名提交"}</span>
            </label>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50">
              <Send className="w-4 h-4" /> {loading ? (isEn ? "Submitting..." : "提交中...") : (isEn ? "Submit" : "提交")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
