const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KIMI_API_KEY = 'sk-yBaN30XiLcyh4ZkVd7aLMukglXD6P9RSwC9nXCPhjQq3h3Ke';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

async function translateText(text, type = 'title') {
  const prompt = type === 'title'
    ? `Translate this Chinese blog title to English. Return ONLY the English title, nothing else:\n\n${text}`
    : type === 'excerpt'
    ? `Translate this Chinese blog excerpt to English. Return ONLY the English excerpt, nothing else:\n\n${text}`
    : `Translate this Chinese blog article to English. Keep the markdown formatting intact. Return ONLY the English article:\n\n${text}`;

  const res = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: type === 'content' ? 8000 : 500,
    }),
  });

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error(`Translation failed: ${JSON.stringify(data)}`);
  }
  return data.choices[0].message.content.trim();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const posts = await prisma.pages.findMany({
    where: { type: 'BLOG', status: 'PUBLISHED' },
    select: { id: true, title: true, excerpt: true, content: true, titleEn: true, excerptEn: true, contentEn: true },
    orderBy: { createdAt: 'asc' },
  });

  const missingEn = posts.filter(p => !p.titleEn || !p.contentEn);
  console.log(`Total blog posts: ${posts.length}`);
  console.log(`Missing English content: ${missingEn.length}`);

  for (let i = 0; i < missingEn.length; i++) {
    const post = missingEn[i];
    console.log(`\n[${i + 1}/${missingEn.length}] Translating: ${post.title.slice(0, 40)}...`);

    try {
      const updates = {};

      if (!post.titleEn) {
        console.log('  Translating title...');
        updates.titleEn = await translateText(post.title, 'title');
        await sleep(1000);
      }

      if (!post.excerptEn && post.excerpt) {
        console.log('  Translating excerpt...');
        updates.excerptEn = await translateText(post.excerpt, 'excerpt');
        await sleep(1000);
      }

      if (!post.contentEn) {
        console.log('  Translating content...');
        updates.contentEn = await translateText(post.content, 'content');
        await sleep(2000);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.pages.update({
          where: { id: post.id },
          data: updates,
        });
        console.log('  ✅ Saved');
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      await sleep(3000);
    }
  }

  console.log('\n✅ Translation complete!');
  await prisma.$disconnect();
}

main().catch(console.error);
