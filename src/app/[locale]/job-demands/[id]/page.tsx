import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin, DollarSign, Briefcase, User, Calendar } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DemandActions } from "./actions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const demand = await prisma.jobDemand.findUnique({ where: { id } });
  if (!demand) return { title: "Not Found" };
  return { title: `${demand.title} - 求职需求` };
}

export const revalidate = 3600;

export default async function JobDemandDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const isEn = locale === "en";

  const demand = await prisma.jobDemand.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!demand) notFound();

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === demand.userId;

  return (
    <div className="min-h-screen bg-[#f8f7fc] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href={`/${locale}/job-demands`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            {isEn ? "Back to Talent Pool" : "返回求职广场"}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-3">{demand.title}</h1>
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              发布者：{demand.user?.name || (isEn ? "Anonymous" : "匿名用户")}
            </span>
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(demand.createdAt).toLocaleDateString(isEn ? "en-US" : "zh-CN")}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          
          {/* Tags & Info */}
          <div className="p-6 border-b border-gray-50">
            <div className="flex flex-wrap gap-3">
              {demand.location && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 text-gray-700 text-sm rounded-xl font-medium">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {demand.location}
                </span>
              )}
              {demand.salaryMin && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#ecfdf5] text-[#059669] text-sm rounded-xl font-medium border border-[#d1fae5]">
                  <DollarSign className="w-4 h-4" />
                  {demand.salaryMin}{demand.salaryMax ? `-${demand.salaryMax}` : ""} {demand.currency}
                </span>
              )}
              {demand.tags.map((tag) => (
                <span key={tag} className="px-3.5 py-2 bg-[#eef2ff] text-[#4f46e5] text-sm rounded-xl font-medium border border-[#e0e7ff]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          {demand.bio && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                {isEn ? "Personal Introduction" : "个人介绍"}
              </h3>
              <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {demand.bio}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Actions */}
        <DemandActions id={demand.id} isOwner={!!isOwner} />
      </main>
    </div>
  );
}
