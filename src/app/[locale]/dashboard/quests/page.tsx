import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckCircle, Circle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "我的任务 | JobQuip",
  description: "完成每日任务和新手引导",
};

export default async function QuestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await prisma.userGameProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      taskProgress: {
        include: {
          task: true,
        },
        orderBy: {
          task: {
            sortOrder: "asc",
          },
        },
      },
    },
  });

  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const guideTasks = profile.taskProgress.filter(
    (t) => t.task.category === "GUIDE"
  );
  const dailyTasks = profile.taskProgress.filter(
    (t) => t.task.category === "DAILY"
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
        return "已完成";
      case "IN_PROGRESS":
        return "进行中";
      default:
        return "未开始";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">我的任务</h1>
        <p className="text-gray-600">完成任务获取经验值和金币奖励</p>
      </div>

      {/* 新手引导任务 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">🎯 新手引导</h2>
          <p className="text-sm text-gray-500 mt-1">完成引导任务，快速上手平台</p>
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
                <h3 className="font-medium text-gray-900">{task.task.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {task.task.description}
                </p>

                {task.status === "IN_PROGRESS" && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>进度</span>
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
                  <span className="text-blue-600">+{task.task.expReward} EXP</span>
                  <span className="text-amber-600">+{task.task.coinReward} 金币</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 每日任务 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">📅 每日任务</h2>
          <p className="text-sm text-gray-500 mt-1">每天完成任务获取额外奖励</p>
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
                  <h3 className="font-medium text-gray-900">{task.task.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {task.task.description}
                  </p>

                  {task.status === "IN_PROGRESS" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>进度</span>
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
                    <span className="text-blue-600">+{task.task.expReward} EXP</span>
                    <span className="text-amber-600">+{task.task.coinReward} 金币</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p>今日任务已全部完成！🎉</p>
              <p className="text-sm mt-2">明天再来获取新的每日任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
