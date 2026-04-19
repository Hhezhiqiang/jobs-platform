export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import CompanyAnalyticsClient from "./client";

export default async function CompanyAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login/company`);
  }

  const membership = await prisma.company_members.findFirst({
    where: { userId: session.user.id },
    include: { companies: true },
  });

  if (!membership && session.user.role !== "ADMIN") {
    redirect(`/${locale}/company/register`);
  }

  const companyId = membership?.companyId;

  const days = 30;
  const dateRange = Array.from({ length: days }, (_, i) =>
    subDays(new Date(), days - 1 - i)
  );
  const startDate = startOfDay(dateRange[0]);
  const endDate = endOfDay(dateRange[dateRange.length - 1]);

  const whereJob = companyId ? { companyId } : {};
  const whereApp = companyId
    ? { job: { companyId }, appliedAt: { gte: startDate, lte: endDate } }
    : { appliedAt: { gte: startDate, lte: endDate } };

  const [jobCount, activeJobsCount, applicationsCount, pendingApplicationsCount, appRows] =
    await Promise.all([
      prisma.jobs.count({ where: whereJob }),
      prisma.jobs.count({ where: { ...whereJob, status: "ACTIVE" } }),
      prisma.job_applications.count({ where: companyId ? { jobs: { companyId } } : {} }),
      prisma.job_applications.count({
        where: companyId
          ? { status: "PENDING", jobs: { companyId } }
          : { status: "PENDING" },
      }),
      companyId
        ? prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("appliedAt") as date, COUNT(*) as count
            FROM job_applications ja
            JOIN jobs j ON ja."jobId" = j.id
            WHERE ja."appliedAt" >= ${startDate}
              AND ja."appliedAt" <= ${endDate}
              AND j."companyId" = ${companyId}
            GROUP BY DATE("appliedAt")
            ORDER BY date ASC
          `
        : prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
            SELECT DATE("appliedAt") as date, COUNT(*) as count
            FROM job_applications
            WHERE "appliedAt" >= ${startDate}
              AND "appliedAt" <= ${endDate}
            GROUP BY DATE("appliedAt")
            ORDER BY date ASC
          `,
    ]);

  const appMap = new Map(
    (appRows || []).map((r) => [format(r.date, "yyyy-MM-dd"), Number(r.count)])
  );

  const trend = dateRange.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: key,
      display: format(d, "MM/dd"),
      applications: appMap.get(key) || 0,
    };
  });

  const topJobs = await prisma.jobs.findMany({
    where: { ...whereJob, status: "ACTIVE" },
    include: {
      _count: { select: { job_applications: true } },
      companies: { select: { name: true } },
    },
    orderBy: { job_applications: { _count: "desc" } },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyAnalyticsClient
        companyName={membership?.companies?.name || "企业"}
        stats={{
          jobsCount: jobCount,
          activeJobsCount,
          applicationsCount,
          pendingApplicationsCount,
        }}
        trend={trend}
        topJobs={topJobs.map((j) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          applications: j._count.job_applications,
          views: j.viewCount || 0,
          companyName: j.companies?.name || "",
        }))}
      />
    </div>
  );
}
