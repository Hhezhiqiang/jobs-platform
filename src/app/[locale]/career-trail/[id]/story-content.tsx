"use client";

import ReactMarkdown from "react-markdown";

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
}

interface StoryContentProps {
  title: string;
  content: string;
  type: string;
  timeline?: TimelineItem[];
}

// Story type map for display
const storyTypeMap: Record<string, { label: string; color: string; bgColor: string }> = {
  EXPERIENCE: { label: "经验分享", color: "text-blue-600", bgColor: "bg-blue-100" },
  TRANSITION: { label: "职业转型", color: "text-purple-600", bgColor: "bg-purple-100" },
  MILESTONE: { label: "职业里程碑", color: "text-green-600", bgColor: "bg-green-100" },
  CHALLENGE: { label: "挑战与成长", color: "text-orange-600", bgColor: "bg-orange-100" },
  INSIGHT: { label: "行业洞察", color: "text-cyan-600", bgColor: "bg-cyan-100" },
};

export function StoryContent({ title, content, type, timeline }: StoryContentProps) {
  const typeInfo = storyTypeMap[type] || storyTypeMap.EXPERIENCE;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeInfo.bgColor} ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
          {title}
        </h1>

        {/* Timeline (if exists) */}
        {timeline && timeline.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              时间线
            </h2>
            <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
              {timeline.map((item, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      {item.date}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
          <ReactMarkdown
            components={{
              h2: ({ children }) => {
                const text = String(children);
                const id = text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
                return <h2 id={`heading-${id}`} className="scroll-mt-24 text-2xl font-bold mt-8 mb-4">{children}</h2>;
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
                return <h3 id={`heading-${id}`} className="scroll-mt-24 text-xl font-bold mt-6 mb-3">{children}</h3>;
              },
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg italic my-6">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
