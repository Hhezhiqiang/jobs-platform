"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 延迟发送，避免影响页面性能
    const timer = setTimeout(() => {
      trackPageView(pathname);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

async function trackPageView(path: string) {
  try {
    // 只在生产环境记录
    if (process.env.NODE_ENV === "development") {
      return;
    }

    await fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error("Page tracking failed:", error);
  }
}
