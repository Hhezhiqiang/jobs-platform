const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

if (!KIMI_API_KEY) {
  throw new Error('KIMI_API_KEY not set');
}

async function translateTitle(text) {
  const res = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: `Translate this Chinese job title to English. Return ONLY the English title:\n\n${text}` }],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const jobs = await prisma.jobs.findMany({
    where: { status: 'ACTIVE', titleEn: null },
    select: { id: true, title: true },
  });

  console.log(`Translating ${jobs.length} job titles...`);

  for (let i = 0; i < jobs.length; i++) {
    try {
      const en = await translateTitle(jobs[i].title);
      if (en) {
        await prisma.jobs.update({
          where: { id: jobs[i].id },
          data: { titleEn: en },
        });
        console.log(`✅ ${jobs[i].title} → ${en}`);
      }
      await sleep(1500);
    } catch (err) {
      console.error(`❌ ${jobs[i].title}: ${err.message}`);
      await sleep(3000);
    }
  }

  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

main().catch(console.error);
