import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "dashboard.achievementsPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AchievementsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "dashboard.achievementsPage" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await prisma.user_game_profiles.findUnique({
    where: { userId: session.user.id },
    include: {
      user_achievements: {
        include: {
          achievements: true,
        },
      },
    },
  });

  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const allAchievements = await prisma.achievements.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const unlockedIds = new Set(profile.user_achievements.map(a => a.achievementId));

  const achievements = allAchievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
    unlockedAt: profile.user_achievements.find(a => a.achievementId === achievement.id)?.unlockedAt,
  }));

  const unlockedCount = profile.user_achievements.length;
  const totalCount = allAchievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600">{t("subtitle")}</p>
      </div>

      {/* Progress overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">{t("progressLabel")}</p>
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

      {/* Achievements list */}
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
                      <span className="text-green-600 font-medium">{t("unlocked")}</span>
                      {achievement.unlockedAt && (
                        <span className="text-gray-400">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">{t("locked")}</span>
                  )}
                </div>

                {achievement.unlocked && (
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {t("expReward", { exp: achievement.expReward })}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      {t("coinReward", { coin: achievement.coinReward })}
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
