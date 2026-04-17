/**
 * 更新 jobtg 导入的职位描述
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Job mapping: jobtg ID -> { localId, title }
const JOB_MAP: Record<string, { localId: string; title: string }> = {
  "2026041207572327": { localId: "", title: "网络工程师" },
  "2026033002225553": { localId: "", title: "菲律宾公关经理" },
  "2026032706310875": { localId: "", title: "客服主管" },
  "2026032706285848": { localId: "", title: "SEO" },
  "2026032706235339": { localId: "", title: "SEO" },
  "2026032602224671": { localId: "", title: "社交聊天软件市场推广负责人" },
  "2026022207542767": { localId: "", title: "财务会计专员" },
  "2026013106070966": { localId: "", title: "支付运营专员" },
  "2025111704183635": { localId: "", title: "越南国家经理" },
  "2025111207264721": { localId: "", title: "招聘组长" },
  "2025111207253540": { localId: "", title: "招聘专员" },
  "2025101306555406": { localId: "", title: "中高级产品经理" },
  "2025082006064521": { localId: "", title: "Cocos开发" },
  "2025080803363160": { localId: "", title: "品牌运营" },
  "2025042409053966": { localId: "", title: "包网招商商务专员" },
  "2025032802493035": { localId: "", title: "远程高级产品经理" },
  "2025032802444690": { localId: "", title: "远程OpenClaw自动化集成工程师" },
  "2025021402405817": { localId: "", title: "远程AI视频剪辑师" },
  "2025021402370581": { localId: "", title: "远程Php高级工程师" },
  "2025011806373531": { localId: "", title: "高级flutter" },
};

async function main() {
  // 1. Map jobtg IDs to local DB IDs
  const jobs = await prisma.jobs.findMany({
    where: { slug: { contains: 'jobtg' } },
    select: { id: true, slug: true, title: true },
  });

  for (const j of jobs) {
    const match = j.slug.match(/jobtg-(\d+)/);
    if (match && JOB_MAP[match[1]]) {
      JOB_MAP[match[1]].localId = j.id;
    }
  }

  console.log(`=== 开始更新 ${Object.keys(JOB_MAP).length} 个职位描述 ===\n`);

  let updated = 0;
  let skipped = 0;

  for (const [jobtgId, info] of Object.entries(JOB_MAP)) {
    if (!info.localId) {
      console.log(`⏭️ 未找到本地职位: ${jobtgId} (${info.title})`);
      skipped++;
      continue;
    }

    const filePath = `/tmp/desc_${jobtgId}.txt`;
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      skipped++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse content
    const descMatch = content.match(/职位描述([\s\S]*?)(?:特别申明|工作地址|相似职位)/);
    const description = descMatch ? descMatch[1].trim() : '';

    const reqMatch = content.match(/任职要求([\s\S]*?)(?:特别申明|工作地址|相似职位)/);
    const requirements = reqMatch ? reqMatch[1].trim() : '';

    const compMatch = content.match(/公司简介([\s\S]*?)公司规模/);
    const companyInfo = compMatch ? compMatch[1].trim() : '';

    const sizeMatch = content.match(/公司规模[：:]?\s*(\d+[^\n]*)/);
    const companySize = sizeMatch ? sizeMatch[1].trim() : '';

    console.log(`\n[${updated + skipped + 1}/${Object.keys(JOB_MAP).length}] ${info.title}`);
    console.log(`  描述: ${description.slice(0, 50)}... (${description.length}字)`);
    console.log(`  要求: ${requirements.slice(0, 50)}... (${requirements.length}字)`);

    if (description || requirements) {
      await prisma.jobs.update({
        where: { id: info.localId },
        data: {
          description: description || undefined,
          requirements: requirements || undefined,
        },
      });

      // Update company info
      const job = await prisma.jobs.findUnique({
        where: { id: info.localId },
        select: { companyId: true },
      });
      if (job && (companyInfo || companySize)) {
        await prisma.companies.update({
          where: { id: job.companyId },
          data: {
            description: companyInfo || undefined,
            size: companySize || undefined,
          },
        });
      }

      console.log(`  ✅ 更新成功`);
      updated++;
    } else {
      console.log(`  ⚠️ 无内容可更新`);
      skipped++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ 完成！成功: ${updated}, 跳过: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
