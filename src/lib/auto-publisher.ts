import { prisma } from "@/lib/prisma";
import { collectArchives } from "./archive-engine";
import { generateSEOPlan } from "./seo-plan";
import { publishSEOPlan } from "./publish-plan";

const AUTO_PUBLISH_ENABLED = process.env.AUTO_PUBLISH_ENABLED === "true";

export interface AutoPipelineResult {
  processed: number;
  published: number;
  errors: number;
  details: Array<{ monitorId: string; keyword: string; stage: string; error?: string; url?: string }>;
}

/**
 * Fully automatic pipeline: for newly inserted high-value keywords,
 * collect archives → generate SEO plan → publish page.
 */
export async function runAutoPipeline(newMonitorIds: string[]): Promise<AutoPipelineResult> {
  if (!AUTO_PUBLISH_ENABLED || newMonitorIds.length === 0) {
    return { processed: 0, published: 0, errors: 0, details: [] };
  }

  // Find author (fallback to first admin user)
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!adminUser) {
    console.error("[auto-pipeline] No admin user found, cannot auto-publish.");
    return { processed: 0, published: 0, errors: 1, details: [] };
  }

  const authorId = adminUser.id;

  // Fetch the actual monitors and filter for high-value ones
  const monitors = await prisma.keywordMonitor.findMany({
    where: {
      id: { in: newMonitorIds },
      category: { in: ["PRIMARY", "TRAFFIC"] },
      trendScore: { gte: 50 },
    },
    orderBy: { trendScore: "desc" },
    take: 5, // Limit to avoid rate limits / timeouts
  });

  const result: AutoPipelineResult = {
    processed: 0,
    published: 0,
    errors: 0,
    details: [],
  };

  for (const monitor of monitors) {
    const detail: AutoPipelineResult["details"][number] = {
      monitorId: monitor.id,
      keyword: monitor.keyword,
      stage: "started",
    };

    try {
      // 1. Collect archives
      detail.stage = "archive";
      await collectArchives(monitor.id);

      // 2. Generate SEO plan
      detail.stage = "seo-plan";
      const existingPlan = await prisma.sEOPlan.findFirst({
        where: { monitorId: monitor.id },
      });

      let planId: string;
      if (existingPlan) {
        planId = existingPlan.id;
      } else {
        await generateSEOPlan(monitor.id);
        const freshPlan = await prisma.sEOPlan.findFirst({
          where: { monitorId: monitor.id },
          orderBy: { generatedAt: "desc" },
        });
        if (!freshPlan) {
          throw new Error("SEO plan generation succeeded but plan not found in DB");
        }
        planId = freshPlan.id;
      }

      // 3. Publish
      detail.stage = "publish";
      const publishResult = await publishSEOPlan(planId, authorId);
      detail.url = publishResult.url;
      result.published++;

      if (process.env.NODE_ENV === "development") {
         
        console.log(`[auto-pipeline] Published ${monitor.keyword} → ${publishResult.url}`);
      }
    } catch (err) {
      detail.error = (err as Error).message;
      result.errors++;
      console.error(`[auto-pipeline] Failed at ${detail.stage} for ${monitor.keyword}:`, detail.error);
    }

    result.processed++;
    result.details.push(detail);
  }

  return result;
}
