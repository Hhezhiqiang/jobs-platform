import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StoryDetail } from "@/components/career-trail/story-detail";
import { ResonanceSection } from "@/components/career-trail/resonance-section";

interface StoryPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const story = await prisma.careerStory.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!story) {
    return {
      title: "故事不存在",
    };
  }

  return {
    title: `${story.title} - 职迹`,
    description: story.content.slice(0, 200),
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const story = await prisma.careerStory.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          description: true,
          location: true,
          industry: true,
          size: true,
          website: true,
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      },
      _count: {
        select: {
          resonances: true,
        },
      },
    },
  });

  if (!story) {
    notFound();
  }

  // 增加浏览量
  await prisma.careerStory.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  // 检查用户是否已共鸣
  const userResonance = userId
    ? await prisma.storyResonance.findUnique({
        where: {
          storyId_userId: {
            storyId: id,
            userId,
          },
        },
      })
    : null;

  // 检查用户是否有权限邀请（是公司成员）
  let canInvite = false;
  if (userId && story.companyId) {
    const membership = await prisma.company_members.findFirst({
      where: {
        companyId: story.companyId,
        userId: userId,
        role: { in: ["ADMIN", "RECRUITER"] },
      },
    });
    canInvite = !!membership;
  }

  // 如果是作者，也显示邀请状态
  const isAuthor = story.authorId === userId;

  const typeLabels: Record<string, string> = {
    EXPERIENCE: "经验分享",
    TRANSITION: "职业转型",
    MILESTONE: "职业里程碑",
    CHALLENGE: "挑战与成长",
    INSIGHT: "行业洞察",
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Aurora Breadcrumb */}
        <nav className="mb-6">
          <Link
            href={`/${locale}/career-trail`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6366f1] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回职迹
          </Link>
        </nav>

        {/* Story Detail */}
        <StoryDetail
          story={story}
          locale={locale}
          isAuthor={isAuthor}
          viewCount={story.viewCount + 1}
          typeLabel={typeLabels[story.type] || story.type}
          canInvite={canInvite}
        />

        {/* Resonance Section */}
        <ResonanceSection
          storyId={id}
          locale={locale}
          hasResonated={!!userResonance}
          totalCount={story._count.resonances}
        />
      </div>
    </div>
  );
}
