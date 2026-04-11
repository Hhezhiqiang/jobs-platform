"use client";

import { useEffect, useState } from "react";

const VIEW_STORAGE_KEY = "blog_view_tracker";
const VIEW_TTL_HOURS = 24;

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

function hasTrackedRecently(slug: string): boolean {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return false;
    const map: Record<string, number> = JSON.parse(raw);
    const ts = map[slug];
    if (!ts) return false;
    const expireAt = ts + VIEW_TTL_HOURS * 60 * 60 * 1000;
    return Date.now() < expireAt;
  } catch {
    return false;
  }
}

function markTracked(slug: string): void {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[slug] = Date.now();
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (hasTrackedRecently(slug)) return;

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
          markTracked(slug);
        }
      } catch (error) {
        console.error("Track view error:", error);
      }
    };

    trackView();
  }, [slug]);

  return <span className="text-gray-500">{count.toLocaleString("zh-CN")} 次阅读</span>;
}
