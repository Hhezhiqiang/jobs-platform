import Link from "next/link";
import { User, Settings, Briefcase, FileText, Heart, Bell, Wallet, TrendingUp } from "lucide-react";

const navItems = [
  { icon: User, label: "个人资料", href: "/user/profile", section: "账号设置" },
  { icon: Settings, label: "账号设置", href: "/user/settings", section: "账号设置" },
  { icon: Briefcase, label: "我的申请", href: "/user/applications", section: "求职管理" },
  { icon: FileText, label: "我的简历", href: "/user/resumes", section: "求职管理" },
  { icon: Heart, label: "收藏职位", href: "/user/favorites", section: "求职管理" },
  { icon: Bell, label: "消息通知", href: "/user/notifications", section: "消息" },
  { icon: Wallet, label: "账户余额", href: "/user/recharge", section: "财务" },
  { icon: TrendingUp, label: "推广中心", href: "/user/promoter", section: "推广" },
];

export function AuroraUserSidebar({ currentPath }: { currentPath: string }) {
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <div className="aurora-card rounded-2xl p-6 h-fit sticky top-24">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg shadow-md">
          U
        </div>
        <div>
          <p className="font-semibold text-gray-900">用户</p>
          <p className="text-sm text-gray-500">个人中心</p>
        </div>
      </div>

      {/* Navigation */}
      {Object.entries(groupedItems).map(([section, items]) => (
        <div key={section} className="mb-6 last:mb-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{section}</p>
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#eef2ff] text-[#4f46e5]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-[#6366f1]" : "text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
