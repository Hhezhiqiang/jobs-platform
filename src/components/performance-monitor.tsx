"use client";

import { useEffect, useState } from "react";

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inp?: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 检查 PerformanceObserver 支持
    if ("PerformanceObserver" in window) {
      // LCP - Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        console.log("LCP observation not supported");
      }

      // FID - First Input Delay (使用 INP 替代)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          if (firstEntry) {
            setMetrics((prev) => ({ ...prev, fid: (firstEntry as any).processingStart - firstEntry.startTime }));
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        console.log("FID observation not supported");
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          setMetrics((prev) => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        console.log("CLS observation not supported");
      }

      // FCP - First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          if (firstEntry) {
            setMetrics((prev) => ({ ...prev, fcp: firstEntry.startTime }));
          }
        });
        fcpObserver.observe({ entryTypes: ["paint"] });
      } catch (e) {
        console.log("FCP observation not supported");
      }

      // INP - Interaction to Next Paint
      try {
        let inpValue = 0;
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry && lastEntry.duration > inpValue) {
            inpValue = lastEntry.duration;
            setMetrics((prev) => ({ ...prev, inp: inpValue }));
          }
        });
        inpObserver.observe({ entryTypes: ["event"] });
      } catch (e) {
        console.log("INP observation not supported");
      }
    }

    // TTFB - Time to First Byte
    if ("performance" in window) {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics((prev) => ({ ...prev, ttfb: navigation.responseStart }));
      }
    }
  }, []);

  // 只在开发环境显示性能指标
  if (process.env.NODE_ENV !== "development") return null;

  const getStatus = (metric: keyof PerformanceMetrics, value?: number) => {
    if (value === undefined) return "⏳";
    
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
      inp: { good: 200, poor: 500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "❓";

    if (value <= threshold.good) return "🟢";
    if (value <= threshold.poor) return "🟡";
    return "🔴";
  };

  const formatValue = (metric: keyof PerformanceMetrics, value?: number) => {
    if (value === undefined) return "测量中...";
    
    if (metric === "cls") {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 text-sm font-mono border border-gray-200 max-w-xs">
      <div className="font-bold mb-2 text-gray-800">Core Web Vitals</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>LCP (最大内容绘制)</span>
          <span>{getStatus("lcp", metrics.lcp)} {formatValue("lcp", metrics.lcp)}</span>
        </div>
        <div className="flex justify-between">
          <span>INP (交互延迟)</span>
          <span>{getStatus("inp", metrics.inp)} {formatValue("inp", metrics.inp)}</span>
        </div>
        <div className="flex justify-between">
          <span>CLS (布局偏移)</span>
          <span>{getStatus("cls", metrics.cls)} {formatValue("cls", metrics.cls)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>FCP (首次内容绘制)</span>
          <span>{formatValue("fcp", metrics.fcp)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>TTFB (首字节时间)</span>
          <span>{formatValue("ttfb", metrics.ttfb)}</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t text-xs text-gray-400">
        目标: LCP < 2.5s, INP < 200ms, CLS < 0.1
      </div>
    </div>
  );
}
