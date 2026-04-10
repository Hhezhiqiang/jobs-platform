#!/usr/bin/env tsx
/**
 * ABetterWeb3 招聘岗位导入脚本
 * 将3月和4月的岗位导入到 jobs-platform 数据库
 */

import { PrismaClient, JobStatus, EmploymentType } from "@prisma/client";

const prisma = new PrismaClient();

// 3月和4月的岗位数据（从ABetterWeb3筛选）
const jobsData = [
  // CEX/交易所 - 3月/4月更新的岗位
  {
    companyName: "Gate",
    companySlug: "gate",
    companyIndustry: "CEX/交易所",
    title: "Business & Onboarding Specialist",
    description: `岗位要求：本科，华人（中英流利），做过材料递交、合规供应商的资料整理、海外公司注册和管理

投递方式：@Cathy_cc/@HR_Juju
更新时间：2026.4.8`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 5000,
    salaryMax: 8000,
    salaryCurrency: "USD",
    applyUrl: "mailto:hr@gate.io",
    isRemote: true,
    tags: ["Business", "Onboarding", "Compliance", "远程"],
  },
  {
    companyName: "Gate",
    companySlug: "gate",
    companyIndustry: "CEX/交易所",
    title: "Senior Legal Counsel",
    description: `岗位要求：本科，英语流利，多年法务相关工作经验，其中至少2年区块链行业工作经验

投递方式：@Cathy_cc/@HR_Juju
更新时间：2026.4.8`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "mailto:hr@gate.io",
    isRemote: true,
    tags: ["Legal", "Counsel", "法务", "远程"],
  },
  {
    companyName: "Gate",
    companySlug: "gate",
    companyIndustry: "CEX/交易所",
    title: "工业衍生品设计师",
    description: `岗位要求：本科，有海外设计经验，3年以上衍生品设计经验；需附带作品集

投递方式：@Cathy_cc/@HR_Juju
更新时间：2026.4.8`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 5000,
    salaryMax: 10000,
    salaryCurrency: "USD",
    applyUrl: "mailto:hr@gate.io",
    isRemote: true,
    tags: ["Design", "衍生品", "设计师", "远程"],
  },
  {
    companyName: "LBank",
    companySlug: "lbank",
    companyIndustry: "CEX/交易所",
    title: "合约测试工程师",
    description: `岗位职责：
1. 负责合约交易系统的功能测试
2. 编写测试用例和测试报告
3. 与开发团队协作定位问题

投递方式：@mandy_zhao66
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 4000,
    salaryMax: 8000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/mandy_zhao66",
    isRemote: true,
    tags: ["Testing", "合约", "交易所", "远程"],
  },
  {
    companyName: "LBank",
    companySlug: "lbank",
    companyIndustry: "CEX/交易所",
    title: "AI大模型基建工程师",
    description: `岗位职责：
1. 负责AI大模型基础设施建设
2. 优化模型训练和推理性能
3. 搭建MLops平台

投递方式：@mandy_zhao66
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/mandy_zhao66",
    isRemote: true,
    tags: ["AI", "ML", "大模型", "基建", "远程"],
  },
  {
    companyName: "MEXC",
    companySlug: "mexc",
    companyIndustry: "CEX/交易所",
    title: "UI/UX设计师",
    description: `本周急招岗位🔥

岗位要求：
1. 3年以上UI/UX设计经验
2. 有金融科技或交易所设计经验优先
3. 熟悉Figma、Sketch等设计工具

投递方式：TG: @Shelby_MEXC_HR
邮箱：shelby.yu@mexc.com
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 4000,
    salaryMax: 8000,
    salaryCurrency: "USD",
    applyUrl: "mailto:shelby.yu@mexc.com",
    isRemote: true,
    tags: ["UI/UX", "设计", "急招", "远程"],
  },
  {
    companyName: "MEXC",
    companySlug: "mexc",
    companyIndustry: "CEX/交易所",
    title: "交易风控分析师",
    description: `本周急招岗位🔥

岗位要求：
1. 3年以上金融风控经验
2. 熟悉交易所风控规则和模型
3. 数据分析能力强

投递方式：TG: @Shelby_MEXC_HR
邮箱：shelby.yu@mexc.com
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "mailto:shelby.yu@mexc.com",
    isRemote: true,
    tags: ["Risk", "风控", "交易", "分析师", "急招", "远程"],
  },
  {
    companyName: "MEXC",
    companySlug: "mexc",
    companyIndustry: "CEX/交易所",
    title: "用户增长运营经理",
    description: `本周急招岗位🔥

岗位要求：
1. 5年以上用户增长经验
2. 熟悉海外用户获取渠道
3. 数据驱动，结果导向

投递方式：TG: @Shelby_MEXC_HR
邮箱：shelby.yu@mexc.com
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 5000,
    salaryMax: 10000,
    salaryCurrency: "USD",
    applyUrl: "mailto:shelby.yu@mexc.com",
    isRemote: true,
    tags: ["Growth", "增长", "运营", "经理", "急招", "远程"],
  },
  {
    companyName: "Bitget",
    companySlug: "bitget",
    companyIndustry: "CEX/交易所",
    title: "大前端开发工程师",
    description: `岗位亮点：居家办公

岗位要求：
1. 3年以上前端开发经验
2. 熟悉React/Vue等框架
3. 有币圈/金融经验优先

投递方式：@bobby2048
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/bobby2048",
    isRemote: true,
    tags: ["Frontend", "前端", "React", "Vue", "居家办公"],
  },
  {
    companyName: "Bitget",
    companySlug: "bitget",
    companyIndustry: "CEX/交易所",
    title: "iOS开发工程师",
    description: `岗位亮点：居家办公

岗位要求：
1. 3年以上iOS开发经验
2. 熟悉Swift/Objective-C
3. 有交易所APP开发经验优先

投递方式：@bobby2048
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/bobby2048",
    isRemote: true,
    tags: ["iOS", "移动端", "Swift", "居家办公"],
  },
  // DeFi 协议
  {
    companyName: "SynFutures",
    companySlug: "synfutures",
    companyIndustry: "DeFi/DEX",
    title: "Head of Product for DEX",
    description: `💰 薪资待遇：$200K+团队token分配+绩效奖金

岗位要求：
1. 5年以上产品管理经验
2. 3年以上DeFi/DEX产品经验
3. 对衍生品交易有深入理解
4. 英文可作为工作语言

投递方式：Hiring@synfutures.xyz
地点：香港`,
    location: "Hong Kong",
    employmentType: "FULL_TIME",
    salaryMin: 15000,
    salaryMax: 25000,
    salaryCurrency: "USD",
    applyUrl: "mailto:Hiring@synfutures.xyz",
    isRemote: false,
    tags: ["Product", "Head of Product", "DEX", "DeFi", "高薪"],
  },
  {
    companyName: "SynFutures",
    companySlug: "synfutures",
    companyIndustry: "DeFi/DEX",
    title: "资深DeFi智能合约工程师",
    description: `💰 薪资待遇：$5000u+

岗位要求：
1. 3年以上智能合约开发经验
2. 精通Solidity
3. 有DeFi协议开发经验
4. 熟悉安全审计流程

投递方式：Hiring@synfutures.xyz
地点：香港`,
    location: "Hong Kong",
    employmentType: "FULL_TIME",
    salaryMin: 5000,
    salaryMax: 10000,
    salaryCurrency: "USD",
    applyUrl: "mailto:Hiring@synfutures.xyz",
    isRemote: false,
    tags: ["Smart Contract", "Solidity", "DeFi", "工程师"],
  },
  {
    companyName: "Bedrock",
    companySlug: "bedrock",
    companyIndustry: "DeFi/Layer1",
    title: "Institutional BD",
    description: `🔥🔥 急聘岗位

岗位职责：
开拓机构客户与合作伙伴｜staking&DeFi

岗位要求：
1. 中英文流利
2. 地点灵活
3. 有机构客户资源优先

投递方式：
TG: @tastelikelove
Email: samantha@rockx.com
地点：新加坡/香港/马来西亚/台湾（GMT+8）`,
    location: "Singapore",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "mailto:samantha@rockx.com",
    isRemote: true,
    tags: ["BD", "Business Development", "机构", "急聘", "远程"],
  },
  {
    companyName: "Pharos",
    companySlug: "pharos",
    companyIndustry: "DeFi/DEX",
    title: "DEX智能合约开发工程师",
    description: `💰 薪资待遇：$120K

技术栈：Solidity/Rust/Move

岗位要求：
1. 3年以上智能合约开发经验
2. 熟悉DEX协议原理
3. 有安全审计意识

JD和投递链接：https://docs.google.com/document/d/1uh9iMzsT1pz1EfsJ9nqDDOrmtMO2tmKDK2N5kYqL5rQ/edit?tab=t.0
地点：深圳
TG: @rileyweb3`,
    location: "Shenzhen",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "https://docs.google.com/document/d/1uh9iMzsT1pz1EfsJ9nqDDOrmtMO2tmKDK2N5kYqL5rQ/edit?tab=t.0",
    isRemote: false,
    tags: ["Smart Contract", "Solidity", "Rust", "Move", "DEX"],
  },
  // Layer1/Layer2
  {
    companyName: "0G Labs",
    companySlug: "0g-labs",
    companyIndustry: "Layer1",
    title: "Blockchain Core Engineer",
    description: `岗位要求：
1. 5-10年区块链核心开发经验
2. 精通Rust/Go/C++
3. 有Layer1/共识算法开发经验

投递方式：@ktcheng1
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 10000,
    salaryMax: 20000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/ktcheng1",
    isRemote: true,
    tags: ["Blockchain", "Core", "Layer1", "Rust", "远程"],
  },
  {
    companyName: "SOONetwork",
    companySlug: "soonetwork",
    companyIndustry: "Layer2",
    title: "AI Vibecoding Application Engineer",
    description: `Base: Singapore
Remote: 支持远程

岗位职责：
AI应用开发工程师

投递方式：
TG: @ningruiTG
TG: @YvonneLi504
更新时间：2026.4月`,
    location: "Singapore",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/ningruiTG",
    isRemote: true,
    tags: ["AI", "Vibecoding", "Layer2", "远程"],
  },
  // 钱包
  {
    companyName: "Trust Wallet",
    companySlug: "trust-wallet",
    companyIndustry: "钱包",
    title: "Senior Data Engineer",
    description: `岗位要求：
1. 5年以上数据工程经验
2. 精通AWS/Databricks/Data Pipeline
3. 英文面试，英文可作为工作语言
4. 国内互联网大厂经验加分

投递方式：ying.cao@trustwallet.com
地点：Global Remote
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "mailto:ying.cao@trustwallet.com",
    isRemote: true,
    tags: ["Data Engineer", "AWS", "Databricks", "钱包", "远程"],
  },
  {
    companyName: "Trust Wallet",
    companySlug: "trust-wallet",
    companyIndustry: "钱包",
    title: "Senior Product Manager",
    description: `岗位要求：
1. 5年以上产品管理经验
2. 有钱包产品经验
3. 英文面试，英文可作为工作语言
4. 国内互联网大厂经验加分

投递方式：ying.cao@trustwallet.com
地点：Global Remote
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "mailto:ying.cao@trustwallet.com",
    isRemote: true,
    tags: ["Product Manager", "Wallet", "产品经理", "远程"],
  },
  // AI+Web3
  {
    companyName: "Byterum",
    companySlug: "byterum",
    companyIndustry: "AI+Web3",
    title: "AI Agent开发工程师",
    description: `公司介绍：
Minara.ai - 全球首个「入金→分析→决策→执行」全闭环金融AI智能体
DMind.ai - Web3垂直大模型

岗位要求：
1. 熟悉LangChain、OpenAI API、Agent架构
2. 有AI Agent开发经验
3. 远程可沟通

其他岗位：
- 运维工程师/SRE
- 后端开发工程师
- 移动端前端开发
- 测试工程师
- 高级产品经理

投递方式：
邮箱: hr@byterum.com
TG: @daisy51518
地点：Onsite/远程混合
更新时间：2026.4月`,
    location: "Global",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 12000,
    salaryCurrency: "USD",
    applyUrl: "mailto:hr@byterum.com",
    isRemote: true,
    tags: ["AI", "Agent", "LangChain", "Web3", "远程"],
  },
  {
    companyName: "TradeOS",
    companySlug: "tradeos",
    companyIndustry: "AI+Web3",
    title: "全栈工程师",
    description: `⚠️ 只接受2025-2026应届生投递

技术栈：
TypeScript、React、Next.js、Postgres DB

岗位要求：
1. 熟练掌握以上技术栈
2. 具备problem-solving能力、自驱、好奇心
3. 有实习、AI相关经历加分

另一岗位：增长市场经理
- 熟悉美股/外汇/黄金/crypto市场（至少两个）
- 具备市场、增长、KOL合作经验

投递方式：Telegram @xkai33
地点：深圳/杭州
更新时间：2026.4月`,
    location: "Shenzhen",
    employmentType: "FULL_TIME",
    salaryMin: 3000,
    salaryMax: 6000,
    salaryCurrency: "USD",
    applyUrl: "https://t.me/xkai33",
    isRemote: false,
    tags: ["Full Stack", "应届生", "TypeScript", "React", "Next.js"],
  },
  // 3月更新岗位
  {
    companyName: "LTP｜LiquidityTech",
    companySlug: "ltp-liquiditytech",
    companyIndustry: "Broker/量化",
    title: "高级Java开发工程师",
    description: `📅 更新日期：2026/03/24

Base：上海&深圳
现场办公 ⬆️ 薪资Open

岗位要求：
1. 有交易所开发经验
2. 拥有钱包、现货、期货、衍生品交易、理财、借贷、合约交易、杠杆、清算、结算等交易系统开发经验
3. 5年以上Java开发经验

投递方式：
HR@liquiditytech.com
备注来源：Abetterweb3
地点：上海&深圳
更新时间：2026.3.24`,
    location: "Shanghai",
    employmentType: "FULL_TIME",
    salaryMin: 8000,
    salaryMax: 20000,
    salaryCurrency: "USD",
    applyUrl: "mailto:HR@liquiditytech.com",
    isRemote: false,
    tags: ["Java", "交易所", "交易系统", "高级"],
  },
  {
    companyName: "LTP｜LiquidityTech",
    companySlug: "ltp-liquiditytech",
    companyIndustry: "Broker/量化",
    title: "风控模型工程师",
    description: `📅 更新日期：2026/03/24

Base：上海
要求：985/211/双一流或QS前100本科以上（硕士优先考虑），接受应届生投递

专业要求：
数学、统计学、金融工程专业优先

岗位要求：
1. 有量化研究、数据分析或金融建模相关实习/项目经验优先
2. 参与量化风控核心模型的开发与维护

投递方式：
HR@liquiditytech.com
备注来源：Abetterweb3
地点：上海
更新时间：2026.3.24`,
    location: "Shanghai",
    employmentType: "FULL_TIME",
    salaryMin: 6000,
    salaryMax: 15000,
    salaryCurrency: "USD",
    applyUrl: "mailto:HR@liquiditytech.com",
    isRemote: false,
    tags: ["Risk Model", "风控", "量化", "数学", "统计"],
  },
];

// 生成slug
function generateSlug(title: string, companySlug: string, index: number): string {
  const timestamp = Date.now();
  const titleSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 30);
  return `${companySlug}-${titleSlug}-${timestamp}-${index}`;
}

async function main() {
  console.log("🚀 开始导入 ABetterWeb3 3月/4月招聘岗位...\n");

  // 首先获取或创建管理员用户
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    // 创建系统管理员用户
    adminUser = await prisma.user.create({
      data: {
        email: "admin@jobs-platform.com",
        name: "系统管理员",
        password: "$2a$10$YourHashedPasswordHere", // 需要替换为实际hash
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("✅ 创建管理员用户\n");
  }

  const authorId = adminUser.id;
  let successCount = 0;
  let errorCount = 0;

  // 先创建所有需要的公司
  const companyMap = new Map<string, string>(); // slug -> id

  for (const job of jobsData) {
    try {
      if (!companyMap.has(job.companySlug)) {
        // 检查公司是否已存在
        let company = await prisma.company.findUnique({
          where: { slug: job.companySlug },
        });

        if (!company) {
          // 创建新公司
          company = await prisma.company.create({
            data: {
              name: job.companyName,
              slug: job.companySlug,
              industry: job.companyIndustry,
              description: `${job.companyName} - ${job.companyIndustry}领域公司`,
              location: job.location,
              website: job.applyUrl.startsWith("mailto:") ? "" : job.applyUrl,
            },
          });
          console.log(`✅ 创建公司: ${job.companyName}`);
        } else {
          console.log(`⚡ 公司已存在: ${job.companyName}`);
        }

        companyMap.set(job.companySlug, company.id);
      }

      const companyId = companyMap.get(job.companySlug)!;
      const slug = generateSlug(job.title, job.companySlug, successCount);

      // 创建职位
      await prisma.job.create({
        data: {
          title: job.title,
          slug: slug,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType as EmploymentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          applyUrl: job.applyUrl,
          status: "ACTIVE" as JobStatus,
          isRemote: job.isRemote,
          companyId: companyId,
          authorId: authorId,
          keywords: job.tags,
        },
      });

      console.log(`✅ 导入岗位: ${job.title} @ ${job.companyName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ 导入失败: ${job.title} @ ${job.companyName}`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 导入完成:`);
  console.log(`   成功: ${successCount} 个岗位`);
  console.log(`   失败: ${errorCount} 个岗位`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("导入过程出错:", error);
  process.exit(1);
});
