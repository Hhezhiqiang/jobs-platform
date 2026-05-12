import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const isEn = locale === "en";
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'BLOG' },
    select: { title: true, excerpt: true }
  });
  
  if (!story) return { title: isEn ? "Not Found" : "未找到" };
  
  return {
    title: isEn ? `${story.title} - JobQuip` : `${story.title} - JobQuip`,
    description: story.excerpt,
  };
}

export default async function CareerStoryPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isEn = locale === "en";
  
  const story = await prisma.pages.findUnique({
    where: { slug, type: 'BLOG' },
    include: {
      users: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });
  
  if (!story) notFound();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">{story.title}</h1>
          <div className="flex items-center gap-4 text-blue-100">
            {story.users?.avatar ? (
              <img src={story.users.avatar} alt={story.users.name || ''} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {story.users?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium">{story.users?.name || 'Anonymous'}</p>
              <p className="text-sm text-blue-200">
                {new Date(story.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl shadow-sm p-8 prose prose-lg max-w-none">
          <ReactMarkdown>{story.content || ''}</ReactMarkdown>
        </article>
        
        {story.keywords && story.keywords.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {story.keywords.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
