import Link from "next/link";
import { User, Settings, Briefcase, FileText, Heart, Bell, Wallet, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface NavItem {
  icon: typeof User;
  labelKey: string;
  href: string;
  sectionKey: string;
}

const navItems: NavItem[] = [
  { icon: User, labelKey: "userSidebar.profile", href: "/user/profile", sectionKey: "userSidebar.accountSettings" },
  { icon: Settings, labelKey: "userSidebar.accountSettings", href: "/user/settings", sectionKey: "userSidebar.accountSettings" },
  { icon: Briefcase, labelKey: "userSidebar.myApplications", href: "/user/applications", sectionKey: "userSidebar.jobManagement" },
  { icon: FileText, labelKey: "userSidebar.myResumes", href: "/user/resumes", sectionKey: "userSidebar.jobManagement" },
  { icon: Heart, labelKey: "userSidebar.savedJobs", href: "/user/favorites", sectionKey: "userSidebar.jobManagement" },
  { icon: Bell, labelKey: "userSidebar.notifications", href: "/user/notifications", sectionKey: "userSidebar.messages" },
  { icon: Wallet, labelKey: "userSidebar.balance", href: "/user/recharge", sectionKey: "userSidebar.finance" },
  { icon: TrendingUp, labelKey: "userSidebar.promoter", href: "/user/promoter", sectionKey: "userSidebar.promotion" },
];

export function AuroraUserSidebar({ currentPath, locale }: { currentPath: string; locale: string }) {
  const t = useTranslations();

  const groupedItems = navItems.reduce((acc, item) => {
    const section = t(item.sectionKey);
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <div className="aurora-card rounded-2xl p-6 h-fit sticky top-24">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg shadow-md">
          U
        </div>
        <div>
          <p className="font-semibold text-gray-900">{t('userSidebar.user')}</p>
          <p className="text-sm text-gray-500">{t('userSidebar.profileCenter')}</p>
        </div>
      </div>

      {Object.entries(groupedItems).map(([section, items]) => {
        const isActiveSection = items.some(item => currentPath === item.href);
        return (
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
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      );
      })}
    </div>
  );
}
