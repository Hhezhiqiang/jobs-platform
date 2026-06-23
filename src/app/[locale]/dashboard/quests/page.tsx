import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckCircle, Circle, Clock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "dashboard.questsPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function QuestsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "dashboard.questsPage" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await prisma.user_game_profiles.findUnique({
    where: { userId: session.user.id },
    include: {
      task_progress: {
        include: {
          task_definitions: true,
        },
        orderBy: {
          task_definitions: {
            sortOrder: "asc",
          },
        },
      },
    },
  });

  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const guideTasks = profile.task_progress.filter(
    (t) => t.task_definitions.category === "GUIDE"
  );
  const dailyTasks = profile.task_progress.filter(
    (t) => t.task_definitions.category === "DAILY"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-6 h-6 text-amber-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return t("status.completed");
      case "IN_PROGRESS":
        return t("status.inProgress");
      default:
        return t("status.notStarted");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600">{t("subtitle")}</p>
      </div>

      {/* Guide tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t("guide.title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("guide.subtitle")}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {guideTasks.map((task) => (
            <div
              key={task.id}
              className={`p-6 flex items-center gap-4 ${
                task.status === "COMPLETED" ? "bg-green-50/50" : ""
              }`}
            >
              {getStatusIcon(task.status)}

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{task.task_definitions.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {task.task_definitions.description}
                </p>

                {task.status === "IN_PROGRESS" && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t("progressLabel")}</span>
                      <span>
                        {task.progress} / {task.target}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${Math.min(100, (task.progress / task.target) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    task.status === "COMPLETED"
                      ? "text-green-600"
                      : task.status === "IN_PROGRESS"
                      ? "text-amber-600"
                      : "text-gray-400"
                  }`}
                >
                  {getStatusText(task.status)}
                </span>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-blue-600">{t("expReward", { exp: task.task_definitions.expReward })}</span>
                  <span className="text-amber-600">{t("coinReward", { coin: task.task_definitions.coinReward })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t("daily.title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("daily.subtitle")}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {dailyTasks.length > 0 ? (
            dailyTasks.map((task) => (
              <div
                key={task.id}
                className={`p-6 flex items-center gap-4 ${
                  task.status === "COMPLETED" ? "bg-green-50/50" : ""
                }`}
              >
                {getStatusIcon(task.status)}

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.task_definitions.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {task.task_definitions.description}
                  </p>

                  {task.status === "IN_PROGRESS" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{t("progressLabel")}</span>
                        <span>
                          {task.progress} / {task.target}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (task.progress / task.target) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      task.status === "COMPLETED"
                        ? "text-green-600"
                        : task.status === "IN_PROGRESS"
                        ? "text-amber-600"
                        : "text-gray-400"
                    }`}
                  >
                    {getStatusText(task.status)}
                  </span>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-blue-600">{t("expReward", { exp: task.task_definitions.expReward })}</span>
                    <span className="text-amber-600">{t("coinReward", { coin: task.task_definitions.coinReward })}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p>{t("dailyDoneTitle")}</p>
              <p className="text-sm mt-2">{t("dailyDoneSubtitle")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
