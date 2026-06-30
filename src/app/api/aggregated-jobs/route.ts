/**
 * API 路由: GET /api/aggregated-jobs
 * 返回聚合后的外部 + 内部岗位
 */

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { aggregateAllJobs } from "@/lib/job-agg-engine";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

async function fetchInternalJobs(keyword: string | undefined, limit: number) {
  const where: Prisma.jobsWhereInput = { status: "ACTIVE" };
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const jobs = await prisma.jobs.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      location: true,
      city: true,
      country: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      employmentType: true,
      experience: true,
      datePosted: true,
      isRemote: true,
      companies: { select: { id: true, name: true, slug: true, logo: true } },
    },
    take: limit,
    orderBy: { datePosted: "desc" },
  });

  return jobs.map(job => ({
    ...job,
    source: "JobQuip",
    sourceUrl: `/zh/jobs/${job.slug}`,
    isInternal: true,
    category: "general",
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const keyword = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const source = searchParams.get("source") || undefined;
    const onlyExternal = searchParams.get("onlyExternal") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const internalJobs = onlyExternal ? [] : await fetchInternalJobs(keyword, limit);
    const externalJobs = source === "internal"
      ? []
      : (await aggregateAllJobs(keyword)).filter(job => !category || job.category === category).slice(0, limit);

    return NextResponse.json({
      internal: internalJobs,
      external: externalJobs,
      total: {
        internal: internalJobs.length,
        external: externalJobs.length,
      },
      sources: [
        { name: "RemoteOK", icon: "📪", category: "web3", status: "active" },
        { name: "CryptoJobsList", icon: "🔗", category: "web3", status: "limited" },
        { name: "Adzuna", icon: "📣", category: "general", status: "active" },
        { name: "JobQuip", icon: "🧾", category: "all", status: "active" },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Aggregation API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aggregated jobs", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
