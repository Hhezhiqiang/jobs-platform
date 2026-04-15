import Link from "next/link";
import Image from "next/image";

interface StoryDetailProps {
  story: {
    id: string;
    title: string;
    content: string;
    type: string;
    viewCount: number;
    resonanceCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
  locale: string;
  isAuthor: boolean;
  viewCount: number;
  typeLabel: string;
}

const typeIcons: Record<string, string> = {
  EXPERIENCE: "💡",
  TRANSITION: "🔄",
  MILESTONE: "🏆",
  CHALLENGE: "💪",
  INSIGHT: "🔍",
};

export function StoryDetail({ story, locale, isAuthor, viewCount, typeLabel }: StoryDetailProps) {
  const typeIcon = typeIcons[story.type] || "📝";

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Type */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
          {typeIcon} {typeLabel}
        </span>
        {isAuthor && (
          <Link
            href={`/${locale}/career-trail/${story.id}/edit`}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            编辑
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h1>

      {/* Author Info */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        {story.author.avatar ? (
          <Image
            src={story.author.avatar}
            alt={story.author.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {story.author.name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900">{story.author.name}</div>
          <div className="text-sm text-gray-500">
            {new Date(story.createdAt).toLocaleDateString("zh-CN")}
            {story.createdAt.toISOString() !== story.updatedAt.toISOString() && " · 已编辑"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8 whitespace-pre-wrap">
        {story.content}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pt-6 border-t border-gray-200">
        <span>👁 {viewCount} 浏览</span>
        <span>💙 {story.resonanceCount} 共鸣</span>
        <span>{new Date(story.createdAt).toLocaleDateString("zh-CN")}</span>
      </div>
    </article>
  );
}
