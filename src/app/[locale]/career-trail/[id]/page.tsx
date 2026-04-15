import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StoryDetail } from "@/components/career-trail/story-detail";
import { ResonanceSection } from "@/components/career-trail/resonance-section";

interface StoryPageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const story = await prisma.careerStory.findUnique({
    where: { id: params.id },
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
  const { locale, id } = params;
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

  const typeLabels: Record<string, string> = {
    EXPERIENCE: "经验分享",
    TRANSITION: "职业转型",
    MILESTONE: "职业里程碑",
    CHALLENGE: "挑战与成长",
    INSIGHT: "行业洞察",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href={`/${locale}/career-trail`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
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
          isAuthor={story.authorId === userId}
          viewCount={story.viewCount + 1}
          typeLabel={typeLabels[story.type] || story.type}
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
