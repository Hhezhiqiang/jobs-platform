import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 为所有现有用户初始化游戏档案
 */
async function initGameProfiles() {
  console.log("🎮 开始初始化游戏档案...");

  // 获取所有没有游戏档案的用户
  const usersWithoutProfile = await prisma.users.findMany({
    where: {
      gameProfile: null,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  console.log(`找到 ${usersWithoutProfile.length} 个需要初始化档案的用户`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutProfile) {
    try {
      // 创建游戏档案
      await prisma.userGameProfile.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          nextLevelExp: 100,
          coins: 100, // 初始金币
          title: "求职新人",
          lastLoginAt: new Date(),
        },
      });

      // 创建新手引导任务
      const guideTasks = [
        "GUIDE_COMPLETE_PROFILE",
        "GUIDE_UPLOAD_RESUME",
        "GUIDE_VIEW_JOBS",
        "GUIDE_FIRST_APPLY",
        "GUIDE_JOIN_COMMUNITY",
      ];

      for (const taskCode of guideTasks) {
        await prisma.taskProgress.create({
          data: {
            profileId: (await prisma.userGameProfile.findUnique({
              where: { userId: user.id },
              select: { id: true },
            }))!.id,
            taskId: taskCode,
            status: "PENDING",
            target: 1,
          },
        });
      }

      successCount++;
      console.log(`✅ 已为用户 ${user.email} 创建游戏档案`);
    } catch (error) {
      errorCount++;
      console.error(`❌ 为用户 ${user.email} 创建档案失败:`, error);
    }
  }

  console.log("\n📊 初始化完成:");
  console.log(`   成功: ${successCount}`);
  console.log(`   失败: ${errorCount}`);
}

// 运行初始化
initGameProfiles()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
