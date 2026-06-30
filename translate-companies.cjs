const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

if (!KIMI_API_KEY) {
  throw new Error('KIMI_API_KEY not set');
}

async function translateName(text) {
  const res = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: `Translate this Chinese company name to English. For well-known companies, use their official English name. Return ONLY the English name:\n\n${text}` }],
      temperature: 0.3,
      max_tokens: 100,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const companies = await prisma.companies.findMany({
    where: { nameEn: null },
    select: { id: true, name: true },
  });

  console.log(`Translating ${companies.length} company names...`);

  for (let i = 0; i < companies.length; i++) {
    try {
      const en = await translateName(companies[i].name);
      if (en) {
        await prisma.companies.update({
          where: { id: companies[i].id },
          data: { nameEn: en },
        });
        console.log(`✅ ${companies[i].name} → ${en}`);
      }
      await sleep(1000);
    } catch (err) {
      console.error(`❌ ${companies[i].name}: ${err.message}`);
      await sleep(3000);
    }
  }

  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

main().catch(console.error);
