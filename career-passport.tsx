import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { userId: string; locale: string } }): Promise<Metadata> {
  const user = await prisma.users.findUnique({
    where: { id: params.userId },
    include: { user_profiles: true, user_game_profiles: true },
  });
  if (!user) return { title: "用户不存在" };
  return {
    title: `${user.name || "用户"} 的职业护照 | JobQuip`,
    description: `查看 ${user.name} 的职业经历、技能和成就`,
  };
}

export default async function CareerPassportPage({ params }: { params: { userId: string; locale: string } }) {
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === params.userId;

  const user = await prisma.users.findUnique({
    where: { id: params.userId },
    include: {
      user_profiles: true,
      user_game_profiles: {
        include: {
          user_achievements: {
            include: { achievements: true },
            orderBy: { unlockedAt: "desc" },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const profile = user.user_profiles;
  const gp = user.user_game_profiles;
  const achievements = gp?.user_achievements || [];
  const loginStreak = gp?.loginStreak || 0;
  const level = gp?.level || 1;
  const exp = gp?.exp || 0;
  const title = gp?.title || "求职新人";

  let workExperiences: any[] = [];
  try { workExperiences = profile?.workExperience ? JSON.parse(profile.workExperience as string) : []; } catch { workExperiences = []; }

  let educations: any[] = [];
  try { educations = profile?.education ? JSON.parse(profile.education as string) : []; } catch { educations = []; }

  const skills = profile?.skills || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white mb-8 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)" }} />
          <div className="relative flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-2 border-white/30">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{user.name || "匿名用户"}</h1>
              <p className="text-white/70 text-sm mb-3">{user.email}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">Lv.{level} {title}</span>
                <span className="text-white/60 text-sm">经验 {exp} · 连续签到 {loginStreak} 天</span>
              </div>
            </div>
            {isOwner && (
              <Link href="/zh/dashboard/profile" className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm hover:bg-white/30 transition">编辑资料</Link>
            )}
          </div>
          {profile?.bio && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-white/90 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="space-y-3 text-sm">
                {profile?.gender && <div className="flex justify-between"><span className="text-gray-500">性别</span><span className="text-gray-900">{profile.gender === "MALE" ? "男" : profile.gender === "FEMALE" ? "女" : profile.gender}</span></div>}
                {profile?.location && <div className="flex justify-between"><span className="text-gray-500">所在城市</span><span className="text-gray-900">{profile.location}</span></div>}
                {profile?.birthday && <div className="flex justify-between"><span className="text-gray-500">生日</span><span className="text-gray-900">{new Date(profile.birthday).toLocaleDateString("zh-CN")}</span></div>}
              </div>
            </div>

            {achievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">成就徽章</h3>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map(a => (
                    <div key={a.id} className="text-center">
                      <div className="text-3xl mb-1">{a.achievements.icon}</div>
                      <p className="text-xs text-gray-600 truncate">{a.achievements.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {educations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">教育经历</h3>
                <div className="space-y-4">
                  {educations.map((edu: any, i: number) => (
                    <div key={i} className="border-l-2 border-indigo-200 pl-4">
                      <p className="font-medium text-gray-900">{edu.school || "未知学校"}</p>
                      <p className="text-sm text-gray-500">{edu.major || ""} · {edu.degree || ""}</p>
                      {edu.startDate && <p className="text-xs text-gray-400 mt-1">{edu.startDate} ~ {edu.endDate || "至今"}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">技能</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {workExperiences.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">工作经历</h3>
                <div className="space-y-4">
                  {workExperiences.map((we: any, i: number) => (
                    <div key={i} className="relative pl-6 border-l-2 border-gray-200">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white" />
                      <h4 className="font-medium text-gray-900">{we.company || "未知公司"}</h4>
                      <p className="text-sm text-indigo-600">{we.title || ""}</p>
                      <p className="text-sm text-gray-500 mt-1">{we.description || ""}</p>
                      {we.startDate && <p className="text-xs text-gray-400 mt-1">{we.startDate} ~ {we.endDate || "至今"}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skills.length === 0 && workExperiences.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">这份护照还是空白的</h3>
                <p className="text-gray-500 mb-6">完善个人资料，让你的职业护照更丰富</p>
                {isOwner && (
                  <Link href="/zh/dashboard/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">开始完善资料</Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { if (typeof navigator !== "undefined" && navigator.clipboard) { navigator.clipboard.writeText(window.location.href); alert("链接已复制"); } }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            分享职业护照
          </button>
        </div>
      </div>
    </div>
  );
}
