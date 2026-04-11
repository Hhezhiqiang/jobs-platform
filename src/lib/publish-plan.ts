import { prisma } from "@/lib/prisma";

export interface PublishPlanResult {
  success: boolean;
  pageId: string;
  url: string;
}

export async function publishSEOPlan(
  planId: string,
  authorId: string
): Promise<PublishPlanResult> {
  const plan = await prisma.sEOPlan.findUnique({
    where: { id: planId },
    include: { monitor: true },
  });

  if (!plan) throw new Error("Plan not found");

  if (plan.status === "PUBLISHED") {
    throw new Error("Plan already published");
  }

  if (plan.status === "PENDING") {
    await prisma.sEOPlan.update({
      where: { id: planId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
  }

  const slugBase =
    plan.targetUrl?.split("/").pop() || plan.monitor.normalized.replace(/\s+/g, "-");
  const slug = slugBase.replace(/^-+|-+$/g, "").toLowerCase() || `auto-${Date.now()}`;

  // Ensure unique slug
  const existing = await prisma.page.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  // Generate basic markdown body from outline
  const outline = (plan.outline as any[]) || [];
  const outlineMd = outline
    .map(
      (o: any) =>
        `## ${o.section}\n\n${o.points.map((p: string) => `- ${p}`).join("\n")}`
    )
    .join("\n\n");

  const content = `# ${plan.h1}\n\n${outlineMd}\n\n---\n\n*> 本文由关键词监控系统自动生成，基于 [${plan.monitor.keyword}] 热词数据。*`;

  const page = await prisma.page.create({
    data: {
      slug: finalSlug,
      title: plan.title,
      content,
      excerpt: plan.metaDesc,
      type: plan.pageType === "TOPIC" ? "PAGE" : "BLOG",
      status: "PUBLISHED",
      metaTitle: plan.title,
      metaDescription: plan.metaDesc,
      keywords: plan.keywords,
      authorId,
    },
  });

  // Link keyword to page
  await prisma.keywordMonitor.update({
    where: { id: plan.monitorId },
    data: {
      pages: { connect: { id: page.id } },
      status: "PUBLISHED",
    },
  });

  // Update plan
  const url = `/${plan.pageType === "TOPIC" ? "topics" : "blog"}/${finalSlug}`;
  await prisma.sEOPlan.update({
    where: { id: planId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishUrl: url,
    },
  });

  return { success: true, pageId: page.id, url };
}
