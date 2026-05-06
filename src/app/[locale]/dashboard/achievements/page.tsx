import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "我的成就 | JobQuip",
  description: "查看你在JobQuip获得的成就徽章",
};

export default async function AchievementsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await prisma.userGameProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      achievements: {
        include: {
          achievement: true,
        },
      },
    },
  });

  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const unlockedIds = new Set(profile.achievements.map(a => a.achievementId));
  
  const achievements = allAchievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
    unlockedAt: profile.achievements.find(a => a.achievementId === achievement.id)?.unlockedAt,
  }));

  const unlockedCount = profile.achievements.length;
  const totalCount = allAchievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">我的成就</h1>
        <p className="text-gray-600">完成各种挑战，收集成就徽章</p>
      </div>

      {/* 进度概览 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">成就收集进度</p>
            <p className="text-3xl font-bold text-gray-900">
              {unlockedCount} / {totalCount}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{progressPercent}%</div>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 成就列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-6 rounded-xl border-2 transition-all ${
              achievement.unlocked
                ? "bg-white border-amber-400 shadow-md"
                : "bg-gray-50 border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`text-4xl ${
                  achievement.unlocked ? "" : "grayscale"
                }`}
              >
                {achievement.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {achievement.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs">
                  {achievement.unlocked ? (
                    <>
                      <span className="text-green-600 font-medium">✓ 已解锁</span>
                      {achievement.unlockedAt && (
                        <span className="text-gray-400">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">未解锁</span>
                  )}
                </div>
                
                {achievement.unlocked && (
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      +{achievement.expReward} EXP
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      +{achievement.coinReward} 金币
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
