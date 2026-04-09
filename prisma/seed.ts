import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理员",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log("管理员创建完成:", admin.email);

  // 创建示例公司
  const company = await prisma.company.upsert({
    where: { slug: "tech-corp" },
    update: {},
    create: {
      name: "科技有限公司",
      slug: "tech-corp",
      description: "一家专注于技术创新的互联网公司",
      industry: "互联网",
      size: "100-500人",
      location: "北京市朝阳区",
      website: "https://example.com",
    },
  });

  console.log("示例公司创建完成:", company.name);

  // 创建示例职位
  const job = await prisma.job.upsert({
    where: { slug: "senior-frontend-engineer" },
    update: {},
    create: {
      title: "高级前端工程师",
      slug: "senior-frontend-engineer",
      description: "负责公司核心产品的前端开发工作...",
      requirements: "1. 3年以上前端开发经验\n2. 精通 React/Vue\n3. 熟悉 TypeScript",
      benefits: "五险一金、带薪年假、弹性工作",
      employmentType: "FULL_TIME",
      experience: "SENIOR",
      salaryMin: 25000,
      salaryMax: 40000,
      salaryCurrency: "CNY",
      location: "北京市朝阳区",
      city: "北京",
      country: "CN",
      applyUrl: "https://example.com/apply",
      status: "ACTIVE",
      companyId: company.id,
      authorId: admin.id,
    },
  });

  console.log("示例职位创建完成:", job.title);

  // 初始化广告位
  const adPositions = [
    { name: "HP_BANNER_01", displayName: "首页横幅", maxAds: 3 },
    { name: "HP_SIDEBAR_01", displayName: "首页侧边栏", maxAds: 2 },
    { name: "JOB_LIST_TOP", displayName: "职位列表顶部", maxAds: 1 },
    { name: "JOB_DETAIL_REC", displayName: "职位详情推荐", maxAds: 2 },
    { name: "JOB_DETAIL_INLINE", displayName: "职位详情内嵌", maxAds: 1 },
    { name: "SEARCH_TOP", displayName: "搜索结果顶部", maxAds: 1 },
    { name: "COMPANY_BANNER", displayName: "公司页横幅", maxAds: 1 },
    { name: "FOOTER_BANNER", displayName: "页脚横幅", maxAds: 1 },
  ];

  for (const pos of adPositions) {
    await prisma.adPosition.upsert({
      where: { name: pos.name },
      update: {},
      create: pos,
    });
  }

  console.log("广告位初始化完成:", adPositions.length, "个");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
