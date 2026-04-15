import Link from "next/link";

interface CategoryFilterProps {
  currentCategory: string;
  locale: string;
}

const categories = [
  { value: "all", label: "全部", icon: "📚" },
  { value: "PROMOTION", label: "晋升加薪", icon: "🚀" },
  { value: "TRANSITION", label: "转行经历", icon: "🔄" },
  { value: "INTERVIEW", label: "面试经验", icon: "🎯" },
  { value: "RESIGN", label: "离职复盘", icon: "👋" },
  { value: "SIDE_HUSTLE", label: "副业探索", icon: "💡" },
  { value: "LEADERSHIP", label: "团队管理", icon: "👥" },
  { value: "REMOTE", label: "远程工作", icon: "🏠" },
  { value: "WORK_LIFE", label: "工作生活", icon: "⚖️" },
  { value: "OTHER", label: "其他", icon: "📝" },
];

export function CategoryFilter({ currentCategory, locale }: CategoryFilterProps) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <Link
          key={cat.value}
          href={`/${locale}/career-trail?category=${cat.value}`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentCategory === cat.value
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
