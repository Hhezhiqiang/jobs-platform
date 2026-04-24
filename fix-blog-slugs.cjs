const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateSlug(title) {
  return title
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
    select: { id: true, slug: true, title: true, titleEn: true },
  });

  console.log(`Total blog posts: ${posts.length}`);
  let updated = 0;

  for (const post of posts) {
    const sourceTitle = post.titleEn || post.title;
    const newSlug = generateSlug(sourceTitle);
    
    // Skip if slug is already English-looking
    if (/^[a-z0-9-]+$/.test(post.slug) && post.slug.length > 10) {
      console.log(`SKIP: ${post.slug}`);
      continue;
    }

    console.log(`OLD: ${post.slug}`);
    console.log(`NEW: ${newSlug}`);

    try {
      await prisma.pages.update({
        where: { id: post.id },
        data: { slug: newSlug },
      });
      updated++;
      console.log('✅ Updated\n');
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }

  console.log(`\n✅ Updated ${updated}/${posts.length} slugs`);
  await prisma.$disconnect();
}

main().catch(console.error);
