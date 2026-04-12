import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { formatDistanceToNow } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Settings, 
  Bell,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Wallet,
} from "lucide-react";

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "待处理", color: "text-yellow-700", bg: "bg-yellow-100" },
  VIEWED: { label: "已查看", color: "text-blue-700", bg: "bg-blue-100" },
  INTERVIEW: { label: "面试邀请", color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { label: "已拒绝", color: "text-red-700", bg: "bg-red-100" },
  OFFER: { label: "已录用", color: "text-purple-700", bg: "bg-purple-100" },
  WITHDRAWN: { label: "已撤回", color: "text-gray-700", bg: "bg-gray-100" },
};

async function withdrawApplication(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }
  const id = formData.get("applicationId") as string;
  if (!id) throw new Error("缺少申请ID");

  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!app || app.userId !== session.user.id) {
    throw new Error("无权操作");
  }

  await prisma.jobApplication.update({
    where: { id },
    data: { status: "WITHDRAWN", withdrewAt: new Date() },
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [user, applicationCount, resumeCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    }),
    prisma.jobApplication.count({ where: { userId: session.user.id } }),
    prisma.resume.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  const recentApplications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedAt: "desc" },
    take: 5,
    include: {
      job: { include: { company: true } },
    },
  });

  // 过滤掉 job 或 company 没有 slug 的申请
  const validApplications = recentApplications.filter(app => 
    app.job?.slug && app.job.slug !== "" &&
    app.job.company?.slug && app.job.company.slug !== ""
  );

  const interviewCount = validApplications.filter((a) => a.status === "INTERVIEW").length;

  const navItems = [
    { icon: LayoutDashboard, label: "概览", href: "/dashboard", active: true },
    { icon: FileText, label: "我的简历", href: "/dashboard/profile" },
    { icon: Briefcase, label: "我的申请", href: "/dashboard/applications" },
    { icon: Wallet, label: "账户余额", href: "/user/recharge" },
    { icon: Settings, label: "账号设置", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{user.name}</h1>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Settings className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1 sticky top-24">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}

              <hr className="my-4 border-gray-100" />

              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  退出登录
                </button>
              </form>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">我的申请</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{applicationCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{interviewCount} 个面试邀请</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">账户余额</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">¥{(user.balance ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <Link 
                  href="/user/recharge" 
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  去充值 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">我的简历</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{resumeCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/profile" 
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  管理简历 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* 计算简历完善度 */}
              {(() => {
                const calculateProfileCompleteness = () => {
                  if (!user.profile) return 0;
                  
                  const fields = [
                    user.name,
                    user.email,
                    user.profile.bio,
                    user.profile.location,
                    user.profile.gender,
                    user.profile.skills?.length > 0,
                  ];
                  
                  const filledFields = fields.filter(field => field && (typeof field === 'string' ? field.trim() !== "" : field === true)).length;
                  return Math.round((filledFields / fields.length) * 100);
                };
                
                const completeness = calculateProfileCompleteness();
                
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">简历完善度</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{completeness}%</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all" 
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    {completeness < 100 && (
                      <p className="mt-2 text-xs text-gray-500">
                        完善度达到100%可以提高被HR发现的几率
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">开始寻找新机会</h3>
                  <p className="text-blue-100">浏览最新职位，发现适合您的工作</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/jobs"
                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                    <Briefcase className="w-5 h-5" />
                    浏览职位
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
                  >
                    <FileText className="w-5 h-5" />
                    完善简历
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">最近申请</h2>
                <Link
                  href="/dashboard/applications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {validApplications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">暂无申请记录</p>
                    <p className="text-gray-500 mb-6">开始探索职位，迈出求职第一步</p>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                    >
                      浏览职位
                    </Link>
                  </div>
                ) : (
                  validApplications.map((app) => (
                    <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {app.job.company.logo ? (
                              <Image
                                src={app.job.company.logo}
                                alt={app.job.company.name}
                                width={48}
                                height={48}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-blue-600">{app.job.company.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <Link 
                              href={`/jobs/${app.job.slug}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {app.job.title}
                            </Link>
                            <p className="text-sm text-gray-500">{app.job.company.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(app.appliedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[app.status]?.bg} ${statusMap[app.status]?.color}`}>
                            {statusMap[app.status]?.label || app.status}
                          </span>
                          
                          {app.status === "PENDING" && (
                            <form action={withdrawApplication}>
                              <input type="hidden" name="applicationId" value={app.id} />
                              <button
                                type="submit"
                                className="text-sm text-gray-400 hover:text-red-600 transition-colors"
                              >
                                撤回
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
