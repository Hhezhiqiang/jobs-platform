export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: "planId required" }, { status: 400 });
    }

    const plan = await prisma.sEOPlan.findUnique({
      where: { id: planId },
      include: { monitor: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.status === "PUBLISHED" || plan.status === "PENDING") {
      // Only allow publish from APPROVED; auto-approve if PENDING
      if (plan.status === "PENDING") {
        await prisma.sEOPlan.update({
          where: { id: planId },
          data: { status: "APPROVED", approvedAt: new Date() },
        });
      }
    }

    const slugBase = plan.targetUrl?.split("/").pop() || plan.monitor.normalized.replace(/\s+/g, "-");
    const slug = slugBase.replace(/^-+|-+$/g, "").toLowerCase() || `auto-${Date.now()}`;

    // Ensure unique slug
    const existing = await prisma.page.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Generate basic markdown body from outline
    const outline = (plan.outline as any[]) || [];
    const outlineMd = outline
      .map((o: any) => `## ${o.section}\n\n${o.points.map((p: string) => `- ${p}`).join("\n")}`)
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
        authorId: session.user.id,
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
    await prisma.sEOPlan.update({
      where: { id: planId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishUrl: `/${plan.pageType === "TOPIC" ? "topics" : "blog"}/${finalSlug}`,
      },
    });

    const url = `/${plan.pageType === "TOPIC" ? "topics" : "blog"}/${finalSlug}`;
    return NextResponse.json({ success: true, pageId: page.id, url });
  } catch (error) {
    console.error("[api/admin/seo-plans/publish] error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
