import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    trendBg: "bg-blue-50",
    trendColor: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    trendBg: "bg-green-50",
    trendColor: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    trendBg: "bg-purple-50",
    trendColor: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    trendBg: "bg-orange-50",
    trendColor: "text-orange-600",
  },
  pink: {
    bg: "bg-pink-50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    trendBg: "bg-pink-50",
    trendColor: "text-pink-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    trendBg: "bg-indigo-50",
    trendColor: "text-indigo-600",
  },
};

export interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 数值 */
  value: string | number;
  /** 图标组件 */
  icon: LucideIcon;
  /** 趋势信息 */
  trend?: { value: number; direction: "up" | "down" | "flat" };
  /** 颜色主题 */
  color?: keyof typeof colorMap;
  /** 额外类名 */
  className?: string;
}

/**
 * 统计卡片组件 — 用于 Dashboard 数据概览
 * @example
 * <StatCard title="总用户数" value={1234} icon={Users} trend={{ value: 12, direction: "up" }} color="blue" />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  className,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", colors.trendBg, colors.trendColor)}>
              {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trend.direction === "flat" && <Minus className="h-3 w-3" />}
              <span>
                {trend.direction === "flat"
                  ? "持平"
                  : `${trend.direction === "up" ? "↑" : "↓"} ${trend.value}%`}
              </span>
            </div>
          )}
        </div>
        <div className={cn("rounded-xl p-3", colors.iconBg)}>
          <Icon className={cn("h-6 w-6", colors.iconColor)} />
        </div>
      </div>
    </div>
  );
}
export { StatCard as default };
