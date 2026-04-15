import Link from "next/link";

interface SortSelectorProps {
  currentSort: string;
  locale: string;
}

const sortOptions = [
  { value: "latest", label: "最新发布", icon: "🆕" },
  { value: "popular", label: "最多共鸣", icon: "🔥" },
  { value: "trending", label: "热门浏览", icon: "👀" },
];

export function SortSelector({ currentSort, locale }: SortSelectorProps) {
  return (
    <div className="space-y-2">
      {sortOptions.map((option) => (
        <Link
          key={option.value}
          href={`/${locale}/career-trail?sortBy=${option.value}`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentSort === option.value
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </Link>
      ))}
    </div>
  );
}
