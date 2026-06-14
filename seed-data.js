const { PrismaClient, PageType, PageStatus, CompanyStatus, EmploymentType, ExperienceLevel, JobStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const companies = [
  { name: 'ByteDance (字节跳动)', slug: 'bytedance', description: '全球领先的互联网科技公司，旗下拥有抖音、TikTok 等知名产品。', industry: '互联网', size: '10000+', location: '北京', website: 'https://bytedance.com', verificationStatus: 'APPROVED' },
  { name: 'Tencent (腾讯)', slug: 'tencent', description: '中国最大的互联网综合服务提供商之一。', industry: '互联网', size: '10000+', location: '深圳', website: 'https://tencent.com', verificationStatus: 'APPROVED' },
  { name: 'Alibaba (阿里巴巴)', slug: 'alibaba', description: '旨在让天下没有难做的生意。', industry: '电商/云计算', size: '10000+', location: '杭州', website: 'https://alibaba.com', verificationStatus: 'APPROVED' },
  { name: 'Meituan (美团)', slug: 'meituan', description: '科技零售公司，致力于为大家提供更便利的生活。', industry: '本地生活', size: '5000-10000', location: '北京', website: 'https://meituan.com', verificationStatus: 'APPROVED' },
  { name: 'Binance (币安)', slug: 'binance', description: '全球领先的区块链生态企业。', industry: '区块链/Web3', size: '1000-5000', location: '远程', website: 'https://binance.com', verificationStatus: 'APPROVED' },
  { name: 'Coinbase', slug: 'coinbase', description: '美国上市加密货币交易平台。', industry: '区块链/Web3', size: '1000-5000', location: '远程', website: 'https://coinbase.com', verificationStatus: 'APPROVED' },
  { name: 'Huobi (火币)', slug: 'huobi', description: '全球领先的数字资产交易所。', industry: '区块链/Web3', size: '1000-5000', location: '新加坡', website: 'https://huobi.com', verificationStatus: 'APPROVED' },
  { name: 'OKX', slug: 'okx', description: '全球领先的加密资产交易平台。', industry: '区块链/Web3', size: '1000-5000', location: '远程', website: 'https://okx.com', verificationStatus: 'APPROVED' },
  { name: 'Uniswap Labs', slug: 'uniswap', description: '去中心化交易协议 Uniswap 的开发团队。', industry: '区块链/Web3', size: '50-200', location: '远程', website: 'https://uniswap.org', verificationStatus: 'APPROVED' },
  { name: 'Aave', slug: 'aave', description: '去中心化借贷协议。', industry: '区块链/Web3', size: '50-200', location: '远程', website: 'https://aave.com', verificationStatus: 'APPROVED' },
  { name: '京东', slug: 'jd', description: '中国领先的自营式电商企业。', industry: '电商', size: '10000+', location: '北京', website: 'https://jd.com', verificationStatus: 'APPROVED' },
  { name: '拼多多', slug: 'pinduoduo', description: '中国领先的社交电商平台。', industry: '电商', size: '10000+', location: '上海', website: 'https://pinduoduo.com', verificationStatus: 'APPROVED' },
  { name: '小米', slug: 'xiaomi', description: '智能手机及消费电子产品制造商。', industry: '硬件', size: '10000+', location: '北京', website: 'https://mi.com', verificationStatus: 'APPROVED' },
  { name: 'OPPO', slug: 'oppo', description: '全球领先的智能终端品牌。', industry: '硬件', size: '10000+', location: '东莞', website: 'https://oppo.com', verificationStatus: 'APPROVED' },
  { name: 'vivo', slug: 'vivo', description: '中国领先的智能手机品牌。', industry: '硬件', size: '10000+', location: '东莞', website: 'https://vivo.com', verificationStatus: 'APPROVED' },
  { name: 'NVIDIA', slug: 'nvidia', description: '全球领先的 AI 芯片和 GPU 公司。', industry: '半导体/AI', size: '10000+', location: '远程', website: 'https://nvidia.com', verificationStatus: 'APPROVED' },
  { name: 'Amazon', slug: 'amazon', description: '全球最大的电子商务和云计算公司。', industry: '电商/云计算', size: '10000+', location: '远程', website: 'https://amazon.com', verificationStatus: 'APPROVED' },
  { name: 'Google', slug: 'google', description: '全球领先的搜索引擎和科技公司。', industry: '互联网', size: '10000+', location: '远程', website: 'https://google.com', verificationStatus: 'APPROVED' },
  { name: 'Meta', slug: 'meta', description: 'Facebook 母公司，致力于构建元宇宙。', industry: '互联网', size: '10000+', location: '远程', website: 'https://meta.com', verificationStatus: 'APPROVED' },
  { name: 'Apple', slug: 'apple', description: '全球领先的消费电子和软件公司。', industry: '硬件', size: '10000+', location: '远程', website: 'https://apple.com', verificationStatus: 'APPROVED' },
];

const jobTitles = [
  { title: '高级前端工程师', titleEn: 'Senior Frontend Engineer', type: 'FULL_TIME', exp: 'SENIOR', salaryMin: 30000, salaryMax: 50000, desc: '负责公司核心产品前端架构设计与开发。', descEn: 'Lead the frontend architecture and development of our core products.', req: '5年以上前端开发经验，精通 React/Vue，熟悉 TypeScript。', reqEn: '5+ years of frontend development experience, proficient in React/Vue, familiar with TypeScript.', ben: '五险一金、弹性工作、股票期权、年度体检', benEn: 'Health insurance, flexible work, stock options, annual health check' },
  { title: '后端工程师（Go）', titleEn: 'Backend Engineer (Go)', type: 'FULL_TIME', exp: 'MID', salaryMin: 25000, salaryMax: 45000, desc: '负责微服务架构设计与实现。', descEn: 'Design and implement microservice architecture.', req: '3年以上 Go 开发经验，熟悉 gRPC、Kafka。', reqEn: '3+ years Go development experience, familiar with gRPC and Kafka.', ben: '五险一金、年终奖金、技术培训', benEn: 'Social insurance, year-end bonus, technical training' },
  { title: '产品经理', titleEn: 'Product Manager', type: 'FULL_TIME', exp: 'MID', salaryMin: 25000, salaryMax: 45000, desc: '负责产品规划、需求分析和项目推进。', descEn: 'Responsible for product planning, requirements analysis, and project management.', req: '3年以上互联网产品经验，有数据分析能力。', reqEn: '3+ years of internet product experience, with data analysis skills.', ben: '五险一金、弹性工作、带薪年假', benEn: 'Social insurance, flexible work, paid vacation' },
  { title: '数据科学家', titleEn: 'Data Scientist', type: 'FULL_TIME', exp: 'SENIOR', salaryMin: 35000, salaryMax: 60000, desc: '利用机器学习优化推荐系统。', descEn: 'Use machine learning to optimize recommendation systems.', req: '硕士以上，熟悉 Python、TensorFlow/PyTorch。', reqEn: 'Master degree or above, familiar with Python, TensorFlow/PyTorch.', ben: '高薪、股票期权、远程办公', benEn: 'Competitive salary, stock options, remote work' },
  { title: 'DevOps 工程师', titleEn: 'DevOps Engineer', type: 'FULL_TIME', exp: 'MID', salaryMin: 20000, salaryMax: 40000, desc: '负责 CI/CD 流水线优化和基础设施管理。', descEn: 'Optimize CI/CD pipelines and manage infrastructure.', req: '熟悉 Docker、K8s、Terraform。', reqEn: 'Familiar with Docker, K8s, Terraform.', ben: '弹性工作、技术分享、学习预算', benEn: 'Flexible work, tech sharing, learning budget' },
  { title: '区块链开发工程师', titleEn: 'Blockchain Developer', type: 'FULL_TIME', exp: 'SENIOR', salaryMin: 40000, salaryMax: 80000, desc: '负责智能合约和 DApp 开发。', descEn: 'Develop smart contracts and DApps.', req: '精通 Solidity，有 DeFi 项目开发经验。', reqEn: 'Proficient in Solidity, with DeFi project experience.', ben: '代币激励、远程办公、灵活时间', benEn: 'Token incentives, remote work, flexible hours' },
  { title: '智能合约审计工程师', titleEn: 'Smart Contract Auditor', type: 'FULL_TIME', exp: 'SENIOR', salaryMin: 50000, salaryMax: 100000, desc: '负责智能合约安全审计。', descEn: 'Perform security audits on smart contracts.', req: '精通 Solidity 和常见漏洞模式。', reqEn: 'Proficient in Solidity and common vulnerability patterns.', ben: '高薪、远程、项目奖金', benEn: 'High salary, remote, project bonuses' },
  { title: 'UI/UX 设计师', titleEn: 'UI/UX Designer', type: 'FULL_TIME', exp: 'MID', salaryMin: 18000, salaryMax: 35000, desc: '负责产品界面设计和用户体验优化。', descEn: 'Design product interfaces and optimize user experience.', req: '精通 Figma/Sketch，有移动端设计经验。', reqEn: 'Proficient in Figma/Sketch, with mobile design experience.', ben: '弹性工作、设计工具报销', benEn: 'Flexible work, design tool reimbursement' },
  { title: 'iOS 开发工程师', titleEn: 'iOS Developer', type: 'FULL_TIME', exp: 'MID', salaryMin: 22000, salaryMax: 42000, desc: '负责 iOS 客户端开发和维护。', descEn: 'Develop and maintain iOS client applications.', req: '精通 Swift，熟悉 SwiftUI。', reqEn: 'Proficient in Swift, familiar with SwiftUI.', ben: '五险一金、年终奖金', benEn: 'Social insurance, year-end bonus' },
  { title: '安卓开发工程师', titleEn: 'Android Developer', type: 'FULL_TIME', exp: 'MID', salaryMin: 22000, salaryMax: 42000, desc: '负责 Android 客户端开发。', descEn: 'Develop Android client applications.', req: '精通 Kotlin，熟悉 Jetpack Compose。', reqEn: 'Proficient in Kotlin, familiar with Jetpack Compose.', ben: '五险一金、弹性工作', benEn: 'Social insurance, flexible work' },
];

const cities = ['北京', '上海', '深圳', '杭州', '广州', '远程', '成都'];

async function main() {
  console.log('🌱 开始创建管理员账号...');
  const admin = await prisma.users.upsert({
    where: { email: 'admin@example.com' },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: '$2a$10$EPDmkHkMkQqRkFQhRbVt0.xKzYQqRkFQhRbVt0.xKzYQqRkFQhRbVt0',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {},
  });
  console.log('✅ Admin created:', admin.email);

  console.log('🏢 创建公司...');
  const companyMap = {};
  for (const c of companies) {
    const company = await prisma.companies.upsert({
      where: { slug: c.slug },
      create: { ...c, verificationStatus: CompanyStatus.APPROVED },
      update: {},
    });
    companyMap[c.slug] = company.id;
    console.log(`  ✅ ${c.name}`);
  }

  console.log('💼 创建职位...');
  let jobCount = 0;
  const companySlugs = Object.keys(companyMap);
  for (const jt of jobTitles) {
    for (let i = 0; i < 7; i++) {
      const slug = `${jt.title.toLowerCase().replace(/[^\w]/g, '-').replace(/\s+/g, '-')}-${jobCount + 1}-${Date.now()}`;
      const companySlug = companySlugs[jobCount % companySlugs.length];
      const city = cities[jobCount % cities.length];
      await prisma.jobs.create({
        data: {
          title: jt.title,
          titleEn: jt.titleEn,
          slug,
          description: jt.desc,
          descriptionEn: jt.descEn,
          requirements: jt.req,
          requirementsEn: jt.reqEn,
          benefits: jt.ben,
          benefitsEn: jt.benEn,
          employmentType: EmploymentType[jt.type],
          experience: ExperienceLevel[jt.exp],
          salaryMin: jt.salaryMin + (Math.floor(Math.random() * 5000) * (i + 1)),
          salaryMax: jt.salaryMax + (Math.floor(Math.random() * 5000) * (i + 1)),
          location: `${city}`,
          city,
          isRemote: city === '远程',
          companyId: companyMap[companySlug],
          authorId: admin.id,
          status: JobStatus.ACTIVE,
          datePosted: new Date(),
          applyUrl: `https://${companySlug}.com/careers`,
        },
      });
      jobCount++;
    }
  }
  console.log(`✅ ${jobCount} 个职位已创建`);

  // 创建博客
  console.log('📝 创建博客文章...');
  const blogs = [
    { slug: '2026-web3-salary-report', title: '2026年Web3行业薪资报告：智能合约工程师年薪最高100万', excerpt: '基于5000+真实职位数据，揭秘Web3行业薪资水平。', content: '# 2026年Web3行业薪资报告\n\n## 核心数据\n- 智能合约工程师：年薪50-100万\n- 区块链开发工程师：年薪40-80万\n- DeFi协议开发：年薪60-120万\n\n## 趋势\nWeb3行业薪资持续上涨，特别是DeFi和Layer2方向。' },
    { slug: 'interview-tips-tech-2026', title: '2026年技术面试通关指南：从简历到Offer全流程', excerpt: '大厂面试官告诉你如何准备技术面试。', content: '# 技术面试通关指南\n\n## 简历准备\n- 突出项目经验\n- 量化成果\n\n## 面试流程\n1. 技术面\n2. 系统设计\n3. HR面' },
    { slug: 'frontend-frameworks-2026', title: '2026年前端框架选择指南：React vs Vue vs Svelte', excerpt: '不同场景下的最佳框架选择。', content: '# 2026年前端框架选择\n\n## React\n生态最完善，适合大型项目\n\n## Vue\n上手最快，适合中小项目\n\n## Svelte\n性能最优，适合追求极致体验' },
    { slug: 'remote-work-guide-2026', title: '远程工作完全指南：从找工作到高效协作', excerpt: '越来越多公司提供远程职位，如何把握机会？', content: '# 远程工作指南\n\n## 找远程工作\n- 关注Web3公司\n- 使用远程职位平台\n\n## 高效协作\n- 异步沟通\n- 时间管理' },
    { slug: 'career-change-to-tech', title: '转行互联网：从0到拿到Offer的完整路径', excerpt: '非科班出身如何成功转行？', content: '# 转行互联网\n\n## 学习路径\n1. 选择方向\n2. 系统学习\n3. 项目实践\n4. 求职准备' },
  ];

  for (const blog of blogs) {
    await prisma.pages.upsert({
      where: { slug: blog.slug },
      create: {
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        authorId: admin.id,
        type: PageType.BLOG,
        status: PageStatus.PUBLISHED,
      },
      update: {},
    });
    console.log(`  ✅ ${blog.title}`);
  }

  // 创建职迹
  console.log('📖 创建职迹...');
  const stories = [
    { title: '从小厂到字节：我的前端进阶之路', slug: 'frontend-to-bytedance', excerpt: '5年前端经验总结，从小公司到大厂的蜕变。', content: '## 我的故事\n\n2021年，我还是一个在小公司写jQuery的前端开发。如今，我已经在字节跳动做了3年前端架构。' },
    { title: '35岁转行Web3，我后悔了吗？', slug: 'career-change-web3-35', excerpt: '传统行业转行Web3的真实经历。', content: '## 转行的原因\n\n35岁那年，我意识到传统行业的天花板已经触手可及。' },
    { title: '远程工作三年，年薪翻倍的秘密', slug: 'remote-work-double-salary', excerpt: '远程工作不仅省了通勤时间，收入也大幅上涨。', content: '## 远程工作的优势\n\n三年前我辞去北京的工作，开始远程。' },
  ];

  for (const story of stories) {
    await prisma.pages.upsert({
      where: { slug: story.slug },
      create: {
        slug: story.slug,
        title: story.title,
        excerpt: story.excerpt,
        content: story.content,
        authorId: admin.id,
        type: PageType.CAREER_TRAIL,
        status: PageStatus.PUBLISHED,
      },
      update: {},
    });
    console.log(`  ✅ ${story.title}`);
  }

  console.log('\n🎉 数据库重建完成！');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
