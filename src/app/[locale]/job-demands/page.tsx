import { Metadata } from "next";
import JobDemandsClient from "./job-demands-client";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Job Demands - Find Your Talent" : "求职需求 - 发布你的求职意向",
    description: isEn ? "Browse job demands posted by talents." : "浏览求职者发布的需求，发现优秀人才。",
  };
}

export const revalidate = 60;

export default async function JobDemandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  let demands: any[] = [];
  
  try {
    demands = await prisma.jobDemand.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        location: true,
        tags: true,
        bio: true,
        createdAt: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch job demands:", error);
    demands = [];
  }
    
  return <JobDemandsClient initialDemands={demands} locale={locale} />;
}
