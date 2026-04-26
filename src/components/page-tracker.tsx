"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTracker() {
  const pathname = usePathname();
  const enterTime = useRef(Date.now());
  const clickedElements = useRef<string[]>([]);

  // 页面进入时记录
  useEffect(() => {
    enterTime.current = Date.now();
    clickedElements.current = [];

    // 记录 page_view
    trackEvent("page_view", {
      path: window.location.pathname,
      referrer: document.referrer || undefined,
    });

    // 监听页面点击（职位卡片、博客链接、按钮）
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      const button = target.closest("button");

      if (link) {
        const href = link.getAttribute("href") || "";
        const text = link.textContent?.trim().substring(0, 50) || "";
        clickedElements.current.push(href);

        // 追踪特定类型点击
        if (href.includes("/jobs/")) {
          trackEvent("click_job_card", { target: href, text });
        } else if (href.includes("/blog/")) {
          trackEvent("click_blog_link", { target: href, text });
        } else if (href.includes("/auth/")) {
          trackEvent("click_register", { target: href });
        } else if (href.includes("/apply") || href.includes("/application")) {
          trackEvent("click_apply", { target: href });
        }
      }

      if (button) {
        const text = button.textContent?.trim().substring(0, 50) || "";
        if (text.includes("申请") || text.includes("Apply")) {
          trackEvent("click_apply_button", { text });
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // 页面离开时记录停留时间
  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.floor((Date.now() - enterTime.current) / 1000);
      navigator.sendBeacon?.(
        "/api/analytics/track",
        JSON.stringify({
          type: "page_view",
          path: pathname,
          duration: Math.min(duration, 3600), // 最多 1 小时
          clicked: clickedElements.current.slice(0, 10), // 最多记录 10 次点击
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pathname]);

  return null; // 不渲染任何 UI
}

async function trackEvent(type: string, data: Record<string, unknown>) {
  try {
    navigator.sendBeacon?.(
      "/api/analytics/track",
      JSON.stringify({ type, path: window.location.pathname, ...data })
    );
  } catch {
    // 静默失败，不影响用户体验
  }
}
