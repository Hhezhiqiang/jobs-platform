"use client";

import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
  maxLength?: number;
}

export function HighlightedText({
  text,
  highlight,
  className = "",
  highlightClassName = "bg-yellow-200 text-yellow-900 px-0.5 rounded",
  maxLength,
}: HighlightedTextProps) {
  const processedText = useMemo(() => {
    if (!text) return "";
    
    // 截断文本
    let displayText = text;
    if (maxLength && text.length > maxLength) {
      displayText = text.slice(0, maxLength) + "...";
    }
    
    return displayText;
  }, [text, maxLength]);

  const parts = useMemo(() => {
    if (!highlight || !processedText) {
      return [{ text: processedText, isHighlight: false }];
    }

    const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
    const segments = processedText.split(regex);

    return segments.map((segment) => ({
      text: segment,
      isHighlight: regex.test(segment),
    }));
  }, [processedText, highlight]);

  // 如果没有高亮词，直接返回文本
  if (!highlight || !processedText) {
    return <span className={className}>{processedText}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isHighlight ? (
          <mark
            key={index}
            className={highlightClassName}
            style={{ backgroundColor: "rgb(253 224 71)", color: "rgb(113 63 18)" }}
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
