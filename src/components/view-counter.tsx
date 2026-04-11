"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

export function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // 页面加载时记录一次访问并获取最新阅读量
    const trackView = async () => {
      try {
        const res = await fetch(`/api/blog/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        if (res.ok) {
          const data = await res.json();
          setCount(data.viewCount);
        }
      } catch (error) {
        console.error("Track view error:", error);
      }
    };

    trackView();
  }, [slug]);

  return <span className="text-gray-500">{count.toLocaleString("zh-CN")} 次阅读</span>;
}
