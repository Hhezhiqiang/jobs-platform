"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function generateHeadingId(text: string): string {
  return `heading-${text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30)}`;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 从内容中提取标题
    const headings = content.match(/^#{2,3}\s+(.+)$/gm) || [];
    const tocItems: TOCItem[] = headings.map((heading) => {
      const level = heading.startsWith("###") ? 3 : 2;
      const text = heading.replace(/^#{2,3}\s+/, "");
      const id = generateHeadingId(text);
      return { id, text, level };
    });
    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  if (items.length < 3) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Menu className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">目录</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <nav
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <ul className="py-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left px-6 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  item.level === 3 ? "pl-10" : ""
                } ${
                  activeId === item.id
                    ? "text-blue-600 font-medium bg-blue-50"
                    : "text-gray-600"
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// 用于服务器端渲染的静态目录
export function StaticTableOfContents({ content }: TableOfContentsProps) {
  const headings = content.match(/^#{2,3}\s+(.+)$/gm) || [];
  
  if (headings.length < 3) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Menu className="w-5 h-5 text-blue-600" />
        文章目录
      </h2>
      <ul className="space-y-2">
        {headings.map((heading, index) => {
          const level = heading.startsWith("###") ? 3 : 2;
          const text = heading.replace(/^#{2,3}\s+/, "");
          return (
            <li
              key={index}
              className={`text-sm ${level === 3 ? "pl-4" : ""}`}
            >
              <span className="text-gray-600">{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
