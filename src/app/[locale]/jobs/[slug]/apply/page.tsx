"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, DollarSign, MapPin } from "lucide-react";

interface JobData {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
}

export default function ApplyPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [resumes, setResumes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(pathname || `/${locale}/jobs`)}`);
      return;
    }
    if (status !== "authenticated") return;

    const loadJob = async () => {
      try {
        const { slug } = await params;
        const jobsRes = await fetch(`/api/jobs?limit=100`);
        const jobsData = await jobsRes.json();
        const foundJob = jobsData.jobs?.find((j: any) => j.slug === slug);
        
        if (!foundJob) {
          setError(isEn ? "Job not found" : "职位不存在");
          setLoading(false);
          return;
        }

        setJob({
          id: foundJob.id,
          title: foundJob.title,
          slug: foundJob.slug,
          companyName: foundJob.companies?.name || "",
          location: foundJob.location || "",
          salaryMin: foundJob.salaryMin,
          salaryMax: foundJob.salaryMax,
          employmentType: foundJob.employmentType || "",
        });

        // Fetch user's resumes
        const resumesRes = await fetch("/api/resumes");
        if (resumesRes.ok) {
          const resumesData = await resumesRes.json();
          setResumes(resumesData.resumes || []);
          if (resumesData.resumes?.length > 0) {
            const defaultResume = resumesData.resumes.find((r: any) => r.isDefault) || resumesData.resumes[0];
            setResumeId(defaultResume.id);
          }
        }
      } catch {
        setError(isEn ? "Failed to load job details" : "加载职位详情失败");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [status, params, locale, router, pathname, isEn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job?.id,
          resumeId: resumeId || undefined,
          coverLetter: coverLetter.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || (isEn ? "Application failed" : "申请失败"));
      }
    } catch {
      setError(isEn ? "Application failed, please try again" : "申请失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{isEn ? "Loading..." : "加载中..."}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {isEn ? "Application Submitted!" : "申请已提交！"}
            </h1>
            <p className="text-gray-600 mb-8">
              {isEn
                ? "The employer will review your application shortly. You can track the status in Dashboard."
                : "招聘方将尽快审核您的申请。您可以在个人中心查看申请进度。"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/dashboard/applications`}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                {isEn ? "View Applications" : "查看申请"}
              </Link>
              <Link
                href={`/${locale}/jobs`}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                {isEn ? "Browse Jobs" : "浏览职位"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/${locale}/jobs`} className="text-blue-600 hover:underline">
            {isEn ? "Back to Jobs" : "返回职位列表"}
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${locale}/jobs/${job.slug}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          {isEn ? "Back to Job" : "返回职位"}
        </Link>

        {/* Job Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-gray-600 mb-4">{job.companyName}</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
            {job.salaryMin && job.salaryMax && (
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salaryMin}-{job.salaryMax}K</span>
            )}
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />
              {job.employmentType === "FULL_TIME" ? (isEn ? "Full-time" : "全职") : job.employmentType}
            </span>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">
            {isEn ? "Apply for this position" : "申请职位"}
          </h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Resume Selection */}
          {resumes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEn ? "Select Resume" : "选择简历"}
              </label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {resumes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isDefault ? "(默认)" : ""}
                  </option>
                ))}
              </select>
              <Link href={`/${locale}/dashboard/resumes`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                {isEn ? "Manage resumes" : "管理简历"}
              </Link>
            </div>
          )}

          {resumes.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {isEn
                  ? "You haven't uploaded a resume yet. You can upload one in Dashboard."
                  : "你还没有上传简历。可以在个人中心上传简历。"}
              </p>
              <Link href={`/${locale}/dashboard/resumes`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                {isEn ? "Upload resume" : "上传简历"}
              </Link>
            </div>
          )}

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEn ? "Cover Letter (Optional)" : "求职信（可选）"}
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder={isEn ? "Briefly introduce yourself..." : "简单介绍自己..."}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/jobs/${job.slug}`}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-center text-gray-700 hover:bg-gray-50 transition"
            >
              {isEn ? "Cancel" : "取消"}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting
                ? (isEn ? "Submitting..." : "提交中...")
                : (isEn ? "Submit Application" : "确认申请")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
