"use client";

import Link from "next/link";

interface FilterTabsProps {
  selectedType?: string;
  locale?: string;
}

const filters = [
  { value: "all", label: "全部" },
  { value: "EXPERIENCE", label: "经验分享" },
  { value: "TRANSITION", label: "职业转型" },
  { value: "MILESTONE", label: "职业里程碑" },
  { value: "CHALLENGE", label: "挑战与成长" },
  { value: "INSIGHT", label: "行业洞察" },
];

export function FilterTabs({ selectedType = "all", locale = "zh" }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {filters.map((filter) => {
        const isActive = filter.value === selectedType;

        return (
          <Link
            key={filter.value}
            href={
              filter.value !== "all"
                ? `/${locale}/career-trail?type=${filter.value}`
                : `/${locale}/career-trail`
            }
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
