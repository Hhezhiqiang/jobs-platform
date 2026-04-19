"use client";

import { useEffect, useState, useRef } from "react";

interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: string;
  color?: "blue" | "green" | "purple" | "orange";
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated || value === 0) return;
    
    // SSR: real value already shown. Client: animate on scroll.
    let timer: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setDisplayValue(0);
          const duration = 1500;
          const steps = 40;
          const stepValue = value / steps;
          let current = 0;

          timer = setInterval(() => {
            current += stepValue;
            if (current >= value) {
              setDisplayValue(value);
              if (timer) clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (timer) clearInterval(timer);
      observer.disconnect();
    };
  }, [value, hasAnimated]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export function StatCard({ value, suffix, label, icon, color = "blue" }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    green: "from-green-500 to-green-600 shadow-green-500/25",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/25",
  };

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      
      <div className="text-4xl font-bold text-gray-900 mb-2">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      
      <div className="text-gray-500 font-medium">{label}</div>
    </div>
  );
}

interface StatsSectionProps {
  jobCount: number;
  companyCount: number;
  dailyNewJobs?: number;
}

export function StatsSection({ jobCount, companyCount, dailyNewJobs = 0 }: StatsSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">用数据说话</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            每天都有数千名求职者和企业在这里找到彼此，加入我们，开启职业新篇章
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            value={jobCount || 0}
            suffix="+"
            label="在招职位"
            icon="💼"
            color="blue"
          />
          <StatCard
            value={companyCount || 0}
            suffix="+"
            label="合作企业"
            icon="🏢"
            color="purple"
          />
          <StatCard
            value={98}
            suffix="%"
            label="简历通过率"
            icon="📈"
            color="green"
          />
          <StatCard
            value={dailyNewJobs || 0}
            suffix="+"
            label="日新增职位"
            icon="🚀"
            color="orange"
          />
        </div>
      </div>
    </section>
  );
}
