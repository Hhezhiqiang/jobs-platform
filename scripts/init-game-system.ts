import { PrismaClient } from "@prisma/client";
import { TASKS, ACHIEVEMENTS } from "../src/lib/game/config";

const prisma = new PrismaClient();

/**
 * 初始化游戏化系统数据
 */
async function initGameSystem() {
  console.log("🎮 开始初始化游戏化系统...\n");

  // 1. 创建任务定义
  console.log("📋 创建任务定义...");
  for (const task of TASKS) {
    await prisma.taskDefinition.upsert({
      where: { code: task.code },
      update: {
        name: task.name,
        description: task.description,
        category: task.category,
        expReward: task.expReward,
        coinReward: task.coinReward,
        condition: task.condition,
      },
      create: {
        code: task.code,
        name: task.name,
        description: task.description,
        category: task.category,
        type: task.code,
        expReward: task.expReward,
        coinReward: task.coinReward,
        condition: task.condition,
      },
    });
  }
  console.log(`✅ 创建了 ${TASKS.length} 个任务定义\n`);

  // 2. 创建成就定义
  console.log("🏆 创建成就定义...");
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        expReward: achievement.expReward,
        coinReward: achievement.coinReward,
        condition: achievement.condition,
      },
      create: {
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        expReward: achievement.expReward,
        coinReward: achievement.coinReward,
        condition: achievement.condition,
      },
    });
  }
  console.log(`✅ 创建了 ${ACHIEVEMENTS.length} 个成就定义\n`);

  // 3. 为用户创建游戏档案
  console.log("👤 为用户创建游戏档案...");
  const usersWithoutProfile = await prisma.users.findMany({
    where: { gameProfile: null },
    select: { id: true, email: true },
  });

  console.log(`找到 ${usersWithoutProfile.length} 个需要初始化档案的用户\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutProfile) {
    try {
      // 创建游戏档案
      const profile = await prisma.userGameProfile.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          nextLevelExp: 100,
          coins: 100,
          title: "求职新人",
          lastLoginAt: new Date(),
        },
      });

      // 创建新手引导任务
      const guideTasks = TASKS.filter(t => t.category === "GUIDE");
      for (const task of guideTasks) {
        const taskDef = await prisma.taskDefinition.findUnique({
          where: { code: task.code },
        });

        if (taskDef) {
          await prisma.taskProgress.create({
            data: {
              profileId: profile.id,
              taskId: taskDef.id,
              status: "PENDING",
              target: task.condition.count || 1,
            },
          });
        }
      }

      successCount++;
      console.log(`✅ 已为用户 ${user.email} 创建游戏档案`);
    } catch (error) {
      errorCount++;
      console.error(`❌ 为用户 ${user.email} 创建档案失败:`, error);
    }
  }

  console.log("\n📊 初始化完成:");
  console.log(`   任务定义: ${TASKS.length}`);
  console.log(`   成就定义: ${ACHIEVEMENTS.length}`);
  console.log(`   用户档案: ${successCount} 成功, ${errorCount} 失败`);
}

// 运行初始化
initGameSystem()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
