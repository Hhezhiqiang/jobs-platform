import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AuroraAdminDashboard } from "@/components/aurora/admin-dashboard";

export const metadata: Metadata = {
  title: "管理员控制台 | 求职平台",
  description: "管理平台职位、公司、用户和数据分析",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [jobCount, companyCount, blogCount, totalViews, userCount] = await Promise.all([
    prisma.jobs.count(),
    prisma.companies.count({ where: { verificationStatus: "APPROVED" } }),
    prisma.pages.count({ where: { type: "BLOG" } }),
    prisma.pages.aggregate({
      where: { type: "BLOG" },
      _sum: { viewCount: true },
    }),
    prisma.users.count(),
  ]);

  const [recentJobs, recentBlogs, activeJobs] = await Promise.all([
    prisma.jobs.findMany({
      include: { companies: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.pages.findMany({
      where: { type: "BLOG" },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: { users: true },
    }),
    prisma.jobs.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <AuroraAdminDashboard
      userCount={userCount}
      jobCount={jobCount}
      activeJobs={activeJobs}
      companyCount={companyCount}
      blogCount={blogCount}
      totalViews={totalViews._sum.viewCount || 0}
      recentJobs={recentJobs}
      recentBlogs={recentBlogs}
    />
  );
}
