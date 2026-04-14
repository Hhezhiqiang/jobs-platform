import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const JUNK_MONITOR_DAYS = 30;
const DRAFT_PAGE_DAYS = 30;

export async function cleanupOldData(): Promise<{
  monitorsDeleted: number;
  pagesDeleted: number;
}> {
  const cutoffMonitor = subDays(new Date(), JUNK_MONITOR_DAYS);
  const cutoffPage = subDays(new Date(), DRAFT_PAGE_DAYS);

  const [monitorsResult, pagesResult] = await prisma.$transaction([
    prisma.keyword_monitors.deleteMany({
      where: {
        status: "JUNK",
        firstSeenAt: { lt: cutoffMonitor },
      },
    }),
    prisma.pages.deleteMany({
      where: {
        status: "DRAFT",
        createdAt: { lt: cutoffPage },
      },
    }),
  ]);

  return {
    monitorsDeleted: monitorsResult.count,
    pagesDeleted: pagesResult.count,
  };
}
