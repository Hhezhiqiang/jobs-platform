import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Building2, ArrowLeft, Send, CheckCircle, Clock, Eye, Heart, Filter } from "lucide-react";
import { StoryInviteButton } from "@/components/story-invite-button";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

async function getCompanyStories(companySlug: string, statusFilter?: string) {
  try {
    // 先通过 slug 找到公司
    const company = await prisma.companies.findUnique({
      where: { slug: companySlug },
      select: {
        id: true,
        name: true,
        logo: true,
        slug: true,
      },
    });

    if (!company) return null;

    // 构建查询条件
    const where: { companyId: string; invitationStatus?: string } = {
      companyId: company.id,
    };
    if (statusFilter && ["pending", "accepted", "declined"].includes(statusFilter)) {
      where.invitationStatus = statusFilter;
    }

    // 获取故事列表
    const stories = await prisma.careerStory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return {
      company,
      stories,
    };
  } catch (error) {
    console.error("获取故事数据失败:", error);
    return null;
  }
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
          <Clock className="w-3 h-3" />
          待处理
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          <CheckCircle className="w-3 h-3" />
          已接受
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          已婉拒
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          新故事
        </span>
      );
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    EXPERIENCE: "💡 经验分享",
    TRANSITION: "🔄 职业转型",
    MILESTONE: "🏆 职业里程碑",
    CHALLENGE: "💪 挑战与成长",
    INSIGHT: "🔍 行业洞察",
  };
  return labels[type] || type;
}

export default async function CompanyStoriesPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const sp = await searchParams;
  const statusFilter = sp.status || "";

  const data = await getCompanyStories(slug, statusFilter);

  if (!data) {
    notFound();
  }

  const { company, stories } = data;

  const filterLinks = [
    { label: "全部", status: "" },
    { label: "待处理", status: "pending" },
    { label: "已接受", status: "accepted" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/career-trail`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回职迹
          </Link>

          <div className="flex items-center gap-4">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">@我的故事列表</p>
            </div>
          </div>
        </div>

        {/* Filter - Links with query params */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">筛选状态：</span>
          </div>
          <div className="flex gap-2">
            {filterLinks.map((link) => (
              <Link
                key={link.status}
                href={
                  link.status
                    ? `/${locale}/companies/${slug}/stories?status=${link.status}`
                    : `/${locale}/companies/${slug}/stories`
                }
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  statusFilter === link.status
                    ? link.status === "pending"
                      ? "bg-amber-500 text-white"
                      : link.status === "accepted"
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无故事</h3>
            <p className="text-gray-500">
              {statusFilter
                ? "还没有符合此状态的故事。"
                : "还没有人@您的公司发布职业故事。"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {story.author.avatar ? (
                      <Image
                        src={story.author.avatar}
                        alt={story.author.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {story.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{story.author.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(story.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(story.invitationStatus)}
                  </div>
                </div>

                <Link href={`/${locale}/career-trail/${story.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {story.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {getTypeLabel(story.type)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    {story.viewCount}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Heart className="w-4 h-4" />
                    {story.resonanceCount}
                  </span>
                </div>

                <p className="text-gray-600 line-clamp-3 mb-4">
                  {story.content}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {!story.invitationStatus && (
                    <StoryInviteButton
                      storyId={story.id}
                      companyName={company.name}
                      locale={locale}
                    />
                  )}
                  {story.invitationStatus === "pending" && (
                    <span className="text-amber-600 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      等待作者响应...
                    </span>
                  )}
                  {story.invitationStatus === "accepted" && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      作者已接受邀请
                    </span>
                  )}
                  <Link
                    href={`/${locale}/career-trail/${story.id}`}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    查看详情 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
