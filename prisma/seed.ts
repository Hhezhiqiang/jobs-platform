import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const companies = [
  {
    name: 'ByteDance (字节跳动)',
    slug: 'bytedance',
    description: '全球领先的互联网科技公司。',
    industry: '互联网',
    size: '10000+',
    location: '北京',
    website: 'https://bytedance.com',
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Tencent (腾讯)',
    slug: 'tencent',
    description: '中国最大的互联网综合服务提供商之一。',
    industry: '互联网',
    size: '10000+',
    location: '深圳',
    website: 'https://tencent.com',
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Alibaba (阿里巴巴)',
    slug: 'alibaba',
    description: '旨在让天下没有难做的生意。',
    industry: '电商/云计算',
    size: '10000+',
    location: '杭州',
    website: 'https://alibaba.com',
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Meituan (美团)',
    slug: 'meituan',
    description: '科技零售公司，致力于为大家提供更便利的生活。',
    industry: '本地生活',
    size: '5000-10000',
    location: '北京',
    website: 'https://meituan.com',
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Binance (币安)',
    slug: 'binance',
    description: '全球领先的区块链生态企业。',
    industry: 'Web3/区块链',
    size: '1000-5000',
    location: '远程',
    website: 'https://binance.com',
    verificationStatus: 'APPROVED',
  },
];

const jobs = [
  {
    title: '高级前端开发工程师 (React)',
    slug: 'senior-frontend-engineer-react',
    description: '负责公司核心产品的前端架构设计与开发，优化用户体验。',
    requirements: '3 年以上 React 开发经验，熟悉 Next.js，TypeScript。',
    benefits: '弹性工作、五险一金、补充医疗、免费三餐。',
    employmentType: 'FULL_TIME',
    experience: 'MID',
    salaryMin: 25,
    salaryMax: 45,
    salaryCurrency: 'CNY',
    location: '北京',
    city: '北京',
    country: 'CN',
    isRemote: false,
    status: 'ACTIVE',
    isFeatured: true,
    applyUrl: "https://jobquip.com",
  },
  {
    title: '后端开发工程师 (Go)',
    slug: 'backend-engineer-go',
    description: '参与高并发微服务架构的设计与开发。',
    requirements: '熟练掌握 Go 语言，熟悉 MySQL、Redis、Kafka。',
    benefits: '年终奖、股票期权、年度旅游。',
    employmentType: 'FULL_TIME',
    experience: 'SENIOR',
    salaryMin: 30,
    salaryMax: 50,
    salaryCurrency: 'CNY',
    location: '深圳',
    city: '深圳',
    country: 'CN',
    isRemote: false,
    status: 'ACTIVE',
    isFeatured: true,
    applyUrl: "https://jobquip.com",
  },
  {
    title: 'Web3 产品经理',
    slug: 'web3-product-manager',
    description: '负责 Web3 钱包及 DEX 产品的规划与落地。',
    requirements: '熟悉 DeFi、NFT 等赛道，有 crypto 行业经验。',
    benefits: '远程办公、USDT 结算、社区激励。',
    employmentType: 'FULL_TIME',
    experience: 'MID',
    salaryMin: 30,
    salaryMax: 60,
    salaryCurrency: 'CNY',
    location: '远程',
    city: '远程',
    country: 'CN',
    isRemote: true,
    status: 'ACTIVE',
    isFeatured: false,
    applyUrl: "https://jobquip.com",
  },
  {
    title: 'UI/UX 设计师',
    slug: 'ui-ux-designer',
    description: '负责公司全线产品的 UI/UX 设计工作，提升产品易用性。',
    requirements: '精通 Figma、Sketch，有成熟的作品集。',
    benefits: '扁平化管理、定期团建、下午茶。',
    employmentType: 'FULL_TIME',
    experience: 'MID',
    salaryMin: 20,
    salaryMax: 35,
    salaryCurrency: 'CNY',
    location: '杭州',
    city: '杭州',
    country: 'CN',
    isRemote: false,
    status: 'ACTIVE',
    isFeatured: false,
    applyUrl: "https://jobquip.com",
  },
];

const blogs = [
  {
    title: '2026 年 Web3 行业求职指南',
    slug: '2026-web3-job-guide',
    content: '随着行业的发展，Web3 领域的求职方式也在发生变化...',
    excerpt: '全面了解 Web3 行业的求职趋势、薪资水平及面试技巧。',
    type: 'BLOG',
    status: 'PUBLISHED',
  },
  {
    title: '如何谈薪？互联网大厂薪资结构揭秘',
    slug: 'salary-negotiation-tips',
    content: '在大厂，薪资不仅仅是月薪，还包括股票、年终奖等...',
    excerpt: '揭秘互联网大厂的薪资构成，教你如何拿到满意的 Offer。',
    type: 'BLOG',
    status: 'PUBLISHED',
  },
  {
    title: '远程工作的利与弊：自由还是孤独？',
    slug: 'remote-work-pros-cons',
    content: '远程工作越来越流行，但它真的适合所有人吗？...',
    excerpt: '深入探讨远程工作模式下的职场生活与挑战。',
    type: 'BLOG',
    status: 'PUBLISHED',
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed Companies
  console.log('🏢 Seeding companies...');
  for (const comp of companies) {
    await prisma.companies.upsert({
      where: { slug: comp.slug },
      update: {},
      create: comp,
    });
  }

  // 2. Seed Jobs
  console.log('💼 Seeding jobs...');
  const firstCompany = await prisma.companies.findFirst();
  if (firstCompany) {
    const adminUser = await prisma.users.findFirst();
    for (const job of jobs) {
      await prisma.jobs.upsert({
        where: { slug: job.slug },
        update: {},
        create: {
          ...job,
          companyId: firstCompany.id,
          authorId: adminUser?.id || '',
        },
      });
    }
  }

  // 3. Seed Blogs
  console.log('📝 Seeding blogs...');
  const adminUser = await prisma.users.findFirst();
  for (const blog of blogs) {
    await prisma.pages.upsert({
      where: { slug: blog.slug },
      update: {},
      create: {
        ...blog,
        authorId: adminUser?.id || '',
      },
    });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });