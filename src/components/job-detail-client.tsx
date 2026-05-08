"use client";

import Link from "next/link";
import { MapPin, Briefcase, Clock, DollarSign, Building2, ArrowLeft, ExternalLink, Heart } from "lucide-react";
import { ApplyButton, ShareButton } from "@/components/apply-button";
import { HeartButton } from "@/components/heart-button";
import { formatSalary } from "@/lib/utils";

interface JobDetailPageProps {
  job: any;
  locale: string;
}

export default function JobDetailPageClient({ job, locale }: JobDetailPageProps) {
  const isEn = locale === "en";

  // 修复：使用 formatSalary 替代硬编码拼接
  const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, locale);
    
  const typeMap: Record<string, string> = {
    FULL_TIME: isEn ? "Full-time" : "全职",
    PART_TIME: isEn ? "Part-time" : "兼职",
    CONTRACT: isEn ? "Contract" : "合同工",
    INTERNSHIP: isEn ? "Internship" : "实习",
    FREELANCE: isEn ? "Freelance" : "自由职业",
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Aurora Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Link href={`/${locale}/jobs`} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Back to Jobs" : "返回职位列表"}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {job.companies?.name || "-"}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {job.location || "-"}
            </span>
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {salaryText}
            </span>
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {typeMap[job.employmentType] || job.employmentType}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {job.description && (
              <div className="aurora-card rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Description" : "职位描述"}</h2>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.description}</div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="aurora-card rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Requirements" : "任职要求"}</h2>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.requirements}</div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="aurora-card rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{isEn ? "Benefits" : "福利待遇"}</h2>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-700">{job.benefits}</div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="aurora-card rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{isEn ? "Apply Now" : "立即申请"}</h3>
              
              <ApplyButton
                jobId={job.id}
                jobTitle={job.title}
                companyName={job.companies?.name || ""}
              />

              <div className="mt-4 flex gap-3">
                <HeartButton jobId={job.id} size="md" />
                <ShareButton jobSlug={job.slug} jobTitle={job.title} companyName={job.companies?.name || ""} />
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {isEn ? "Posted" : "发布于"} {new Date(job.datePosted || job.createdAt).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
                </div>
              </div>
            </div>

            {/* Company Info */}
            {job.companies && (
              <div className="aurora-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{isEn ? "Company" : "公司信息"}</h3>
                <Link href={`/${locale}/companies/${job.companies.slug}`} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg">
                    {job.companies.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-[#4f46e5] transition-colors">{job.companies.name}</p>
                    <p className="text-sm text-gray-500">{job.companies.industry || isEn ? "Tech" : "互联网"}</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
