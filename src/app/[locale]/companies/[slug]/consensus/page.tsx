import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Building2, Users, ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { ConsensusClient } from "./components/consensus-client";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// 获取公司数据
async function getCompanyData(slug: string) {
  try {
    const company = await prisma.companies.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        industry: true,
        size: true,
      },
    });
    return company;
  } catch {
    return null;
  }
}

// 获取共识标签数据
async function getConsensusData(companyId: string) {
  try {
    const tags = await prisma.companyCultureTag.findMany({
      where: { companyId },
      orderBy: [
        { voteCount: "desc" },
      ],
    });

    // 处理标签数据，添加客户端需要的字段
    const processedTags = tags.map((tag) => ({
      id: tag.id,
      tagName: tag.tagName,
      category: "POSITIVE" as const,
      positiveCount: tag.voteCount,
      negativeCount: 0,
      netCount: tag.voteCount,
    }));

    return { tags: processedTags, stats: { total: processedTags.length } };
  } catch {
    return { tags: [], stats: { total: 0 } };
  }
}

// 生成元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const company = await getCompanyData(slug);

    if (!company) {
      return { title: "公司未找到" };
    }

    return {
      title: `${company.name} - 团队共识墙`,
      description: `查看${company.name}的团队共识标签，了解员工对公司的真实评价`,
    };
  } catch {
    return { title: "公司未找到" };
  }
}

export default async function ConsensusPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const company = await getCompanyData(slug);

  if (!company) {
    notFound();
  }

  const { tags, stats } = await getConsensusData(company.id);

  // 简化为显示所有标签，不做分类
  const allTags = tags;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-indigo-100 mb-6">
            <Link href="/" className="hover:text-white">首页</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/companies" className="hover:text-white">公司</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/companies/${company.slug}`} className="hover:text-white">
              {company.name}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">共识墙</span>
          </div>

          {/* Company Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {company.logo ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white">
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-2xl">
                {company.name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {company.name}
                <span className="ml-3 text-lg font-normal text-indigo-200">团队共识墙</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-indigo-100">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {company.size}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href={`/companies/${company.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              返回公司主页
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-indigo-200">共识标签总数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-green-300">-</div>
              <div className="text-sm text-indigo-200">参与投票人数</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <ConsensusClient
          companyId={company.id}
          initialTags={tags}
          locale={locale}
        />
      </main>
    </div>
  );
}
