"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 从内容中提取标题
    const headingMatches = content.match(/\n(#{2,3})\s+(.+)/g) || [];
    const extractedHeadings: Heading[] = [];

    headingMatches.forEach((match) => {
      const level = match.match(/^(#{2,3})/)?.[0].length || 2;
      const text = match.replace(/^#{2,3}\s+/, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      extractedHeadings.push({ id, text, level });
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll("[data-heading]");
      let currentId = "";

      headingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = el.getAttribute("id") || "";
        }
      });

      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
      <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
        目录
      </h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm py-1.5 px-2 rounded transition-colors ${
              heading.level === 3 ? "pl-4" : ""
            } ${
              activeId === heading.id
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(heading.id);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            {heading.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
