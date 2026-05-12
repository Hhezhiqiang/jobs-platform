import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'CAREER_TRAIL' },
    select: { title: true, excerpt: true }
  });
  
  if (!story) notFound();
  
  return {
    title: `${story.title} - JobQuip`,
    description: story.excerpt || story.title,
  };
}

export default async function CareerStoryPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'CAREER_TRAIL' },
    include: {
      users: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });
  
  if (!story) notFound();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">{story.title}</h1>
          <div className="flex items-center gap-4 text-indigo-100">
            {story.users?.avatar ? (
              <img src={story.users.avatar} alt={story.users.name || ''} className="w-12 h-12 rounded-full border-2 border-white" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {story.users?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium text-lg">{story.users?.name || 'Anonymous'}</p>
              <p className="text-sm text-indigo-200">
                {new Date(story.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4 prose-strong:text-gray-900 prose-strong:font-semibold prose-li:text-gray-700 prose-li:leading-relaxed prose-ul:my-4 prose-ol:my-4">
            <ReactMarkdown>{story.content || ''}</ReactMarkdown>
          </div>
        </article>
        
        {/* 标签 */}
        {story.keywords && story.keywords.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {story.keywords.map((tag: string, i: number) => (
              <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* 返回按钮 */}
        <div className="mt-8">
          <a href={`/${locale}/career-trail`} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
            ← {isEn ? "Back to Career Trails" : "返回职迹列表"}
          </a>
        </div>
      </div>
    </div>
  );
}
