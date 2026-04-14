"use client";

import { useEffect } from "react";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  useEffect(() => {
    // 为内容中的标题添加锚点
    const contentElement = document.querySelector("[data-blog-content]");
    if (contentElement) {
      const headings = contentElement.querySelectorAll("h2, h3");
      headings.forEach((heading) => {
        const text = heading.textContent || "";
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        heading.id = id;
        heading.setAttribute("data-heading", "true");
      });

      // 为外部链接添加nofollow和target
      const externalLinks = contentElement.querySelectorAll('a[href^="http"]');
      externalLinks.forEach((link) => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer nofollow");
      });

      // 为图片添加懒加载
      const images = contentElement.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
        if (!img.hasAttribute("decoding")) {
          img.setAttribute("decoding", "async");
        }
      });
    }
  }, [content]);

  return (
    <div
      data-blog-content
      className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

function formatContent(content: string): string {
  // 添加代码高亮标记
  let formatted = content
    .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre className="language-$1"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">$1</code>');

  // 添加表格样式
  formatted = formatted
    .replace(/<table>/g, '<div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">')
    .replace(/<\/table>/g, '</table></div>')
    .replace(/<thead>/g, '<thead className="bg-gray-50">')
    .replace(/<th/g, '<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"')
    .replace(/<td/g, '<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"');

  return formatted;
}
