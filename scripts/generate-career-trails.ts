/**
 * 生成 100 条职迹故事内容 - 使用 pages 表存储
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const industries = ['互联网', '人工智能', '金融科技', '电子商务', '游戏', '教育科技', '医疗健康', '智能制造', '新能源', '区块链'];
const companyTypes = ['世界 500 强', '独角兽企业', '初创公司', '国企', '外企', '上市公司'];
const levels = ['实习生', '初级工程师', '工程师', '高级工程师', '技术专家', '技术经理', '技术总监', '产品经理'];
const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都', '南京', '武汉', '西安', '苏州'];
const skills = ['Java', 'Python', 'Go', 'JavaScript', 'React', 'Vue', 'Node.js', 'Spring Boot', 'Docker', 'Kubernetes', 'MySQL', '机器学习', '数据分析', '产品设计', '项目管理'];
const challenges = ['技术架构重构', '团队规模扩张', '业务快速增长', '技术债务清理', '跨部门协作', '技术选型决策', '性能优化'];
const achievements = ['系统性能提升 10 倍', '用户量从 0 到 100 万', '营收增长 300%', '团队从 5 人扩展到 50 人', '获得专利 3 项', '开源项目 Star 破万', '技术大会演讲'];
const insights = ['技术与管理', '工作与生活平衡', '持续学习', '职业规划', '团队协作', '领导力', '创新思维', '抗压能力'];

const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateCareerTrail(index: number) {
  const industry = random(industries);
  const companyType = random(companyTypes);
  const city = random(cities);
  const level = random(levels);
  const years = randomNum(1, 15);
  const skill1 = random(skills);
  const skill2 = random(skills.filter(s => s !== skill1));
  
  const titles = [
    `${industry}${level}的${years}年成长之路`,
    `从${random(levels)}到${level}：我在${companyType}的蜕变`,
    `${city}${industry}从业者的真实经历`,
    `${years}年${industry}经验：${level}的职场感悟`,
    `我在${companyType}做${level}的那些事`,
    `${skill1}工程师的职场进阶指南`,
    `从技术到管理：${level}的转型之路`,
    `${industry}寒冬下的${level}生存指南`,
    `${city}打拼${years}年：${level}的血泪史`,
    `选择${companyType}还是创业公司？${level}的亲身经历`
  ];
  
  const content = `## 个人背景

我是一名在${industry}领域深耕${years}年的${level}，目前就职于${city}的一家${companyType}。

## 职业经历

${randomNum(2010, 2020)}年，我${random(['毕业于', '加入了', '转行到'])}${random(['985 高校', '211 院校', '海外名校', '一家知名企业'])}。

刚开始工作时，我也${random(['迷茫过', '焦虑过', '困惑过'])}。${random(['一次偶然的机会', '一个重要的项目', '一位贵人的指点'])}让我${random(['找到了方向', '明确了目标', '坚定了信心'])}。

## 核心技能

- **${skill1}**：${randomNum(3, 10)}年实战经验
- **${skill2}**：${random(['熟练掌握', '深入了解', '有丰富的实战经验'])}
- **${random(['团队管理', '项目管理', '产品设计'])}**：${random(['带领过', '管理过', '协调过'])}${randomNum(5, 50)}人的团队

## 面临的挑战

在工作中，我遇到过很多挑战，印象最深的是${random(challenges)}。

${random(['那段时间', '那个阶段', '那个项目'])}，我${random(['每天工作 12 小时', '连续加班 3 个月', '压力大到失眠'])}。${random(['但是', '然而', '不过'])}，${random(['坚持下来了', '挺过来了', '克服了困难'])}。

## 取得的成就

${random(['最让我自豪的是', '印象最深的是', '最有成就感的是'])}：${random(achievements)}。

这个成就的背后，是${random(['无数个日夜', '无数次的尝试', '无数次的失败'])}。

## 职场感悟

关于${random(insights)}，我有几点体会：

1. **${random(['持续学习', '保持好奇', '勇于尝试'])}**：${random(['技术更新太快', '行业变化太快', '不学习就会被淘汰'])}。

2. **${random(['团队合作', '有效沟通', '换位思考'])}**：${random(['一个人', '单打独斗', '闭门造车'])}走不远。

3. **${random(['平衡心态', '调整状态', '保持积极'])}**：${random(['职场', '工作', '生活'])}中会遇到很多${random(['挫折', '困难', '压力'])}。

## 给新人的建议

如果你也是${industry}领域的新人：

1. **打好基础**：${random(['基础知识', '核心技能', '基本功'])}很重要。

2. **多实践**：${random(['纸上得来终觉浅', '实践出真知', '做中学'])}。

3. **保持热情**：${random(['热爱', '兴趣', '激情'])}是最好的老师。

## 未来规划

未来${randomNum(1, 5)}年，我计划${random(['深耕技术领域', '转向管理岗位', '创业', '继续深造'])}。

${random(['路漫漫其修远兮', '学无止境', '活到老学到老'])}，${random(['我会', '我将', '我将继续'])}${random(['努力', '奋斗', '前行'])}。

---

*本文内容为${random(['真实经历', '亲身经历', '实际经验'])}，${random(['仅供参考', '欢迎交流', '如有雷同纯属巧合'])}。*

#${industry} #${level} #${skill1} #${skill2} #职场成长 #${city} #${companyType}`;

  return {
    title: titles[index % titles.length],
    content,
    excerpt: content.slice(0, 200) + '...',
    industry,
    city,
    years,
    level,
    tags: [industry, level, skill1, skill2, '职场故事', '职业发展'],
  };
}

async function main() {
  console.log('[career-trails] Starting content generation...');
  
  const users = await prisma.users.findMany({ where: { role: 'USER' }, take: 50 });
  
  if (users.length === 0) {
    const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) { console.log('No users found'); return; }
    users.push(admin);
  }
  
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < 100; i++) {
    const trail = generateCareerTrail(i);
    const author = users[i % users.length];
    const slug = `career-${trail.industry}-${trail.level.replace(/\s/g, '-')}-${i}`;
    
    try {
      const existing = await prisma.pages.findFirst({ where: { slug } });
      if (existing) { skipped++; continue; }
      
      await prisma.pages.create({
        data: {
          slug,
          title: trail.title,
          content: trail.content,
          excerpt: trail.excerpt,
          type: 'CAREER_TRAIL',
          status: 'PUBLISHED',
          keywords: trail.tags,
          authorId: author.id,
          metaTitle: trail.title,
          metaDescription: trail.excerpt,
        }
      });
      
      created++;
      console.log(`[${i + 1}/100] Created: ${trail.title.slice(0, 50)}...`);
    } catch (error) {
      console.error(`[${i + 1}/100] Error:`, (error as Error).message);
      skipped++;
    }
  }
  
  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
  
  const total = await prisma.pages.count({ where: { type: 'CAREER_TRAIL' } });
  console.log(`Total career trails in DB: ${total}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
