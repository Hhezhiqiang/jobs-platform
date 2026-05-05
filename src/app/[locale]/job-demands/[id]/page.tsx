import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin, DollarSign, Briefcase } from "lucide-react";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const demand = await prisma.jobDemand.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!demand) {
    return { title: "Not Found" };
  }

  const isEn = locale === "en";
  return {
    title: isEn ? `${demand.title} - Job Demand` : `${demand.title} - 求职需求`,
    description: demand.bio || undefined,
  };
}

export const revalidate = 3600;

export default async function JobDemandDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const isEn = locale === "en";

  const demand = await prisma.jobDemand.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!demand) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href={`/${locale}/job-demands`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isEn ? "Back to Talent Pool" : "返回求职广场"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {demand.title}
          </h1>
          <p className="text-[#c7d2fe]/80 text-sm">
            {isEn ? "Posted by" : "发布者"}：{demand.user?.name || isEn ? "Anonymous" : "匿名用户"}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Info Tags */}
          <div className="flex flex-wrap gap-3 mb-6">
            {demand.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg">
                <MapPin className="w-4 h-4" />
                {demand.location}
              </span>
            )}
            {demand.salaryMin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ecfdf5] text-[#059669] text-sm rounded-lg">
                <DollarSign className="w-4 h-4" />
                {demand.salaryMin}{demand.salaryMax ? `-${demand.salaryMax}` : ""}{demand.currency}
              </span>
            )}
            {demand.tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-[#eef2ff] text-[#4f46e5] text-sm rounded-lg">
                {tag}
              </span>
            ))}
          </div>

          {/* Bio */}
          {demand.bio && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {isEn ? "Personal Introduction" : "个人介绍"}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {demand.bio}
              </p>
            </div>
          )}

          {/* Meta Info */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Briefcase className="w-4 h-4" />
              <span>
                {isEn ? "Posted on" : "发布于"}：{new Date(demand.createdAt).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
