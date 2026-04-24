const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function main() {
  const posts = await prisma.pages.findMany({
    where: { type: 'BLOG', status: 'PUBLISHED' },
    select: { id: true, slug: true, titleEn: true },
  });

  const chineseSlugs = posts.filter(p => !/^[a-z0-9-]+$/.test(p.slug));
  console.log(`需要修复: ${chineseSlugs.length}/${posts.length}`);

  let updated = 0;
  for (const post of chineseSlugs) {
    const newSlug = slugify(post.titleEn || '');
    if (!newSlug || newSlug.length < 5) continue;

    try {
      await prisma.pages.update({
        where: { id: post.id },
        data: { slug: newSlug },
      });
      updated++;
      console.log(`✅ ${newSlug}`);
    } catch (err) {
      console.error(`❌ ${newSlug}: ${err.message}`);
    }
  }

  console.log(`\n完成: ${updated}/${chineseSlugs.length}`);
  await prisma.$disconnect();
}

main().catch(console.error);
