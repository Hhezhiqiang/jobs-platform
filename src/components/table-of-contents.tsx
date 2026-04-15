import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function useTableOfContents(content: string) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 解析 markdown 标题
    const lines = content.split("\n");
    const extractedHeadings: Heading[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        extractedHeadings.push({ id, text, level });
      }
    });

    // 使用 requestAnimationFrame 避免在渲染期间调用 setState
    requestAnimationFrame(() => {
      setHeadings(extractedHeadings);
    });
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll("[data-heading]");
      let currentActiveId = "";

      headingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          currentActiveId = el.getAttribute("data-heading") || "";
        }
      });

      if (currentActiveId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { headings, activeId };
}
