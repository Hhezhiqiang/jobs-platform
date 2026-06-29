import { Metadata } from "next";
import JobDemandsClient from "./job-demands-client";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';
import { generateStaticPageMetadata } from "@/lib/metadata";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata({
    path: "job-demands",
    locale,
    zh: {
      title: "求职需求广场 - 雇主与候选人直接对话 | JobQuip",
      description: "浏览求职者公开发布的需求与方向，企业可一键发起对话。无中介、不撒网，需求与机会精准对接。",
      keywords: ["求职需求", "人才需求", "招聘需求", "直招", "雇主直聘", "候选人广场", "JobQuip"],
    },
    en: {
      title: "Job Demands - Talent-Posted Briefs for Employers | JobQuip",
      description: "Browse candidate-posted job demands. Employers can reach out directly — no recruiters, no spam, just signal.",
      keywords: ["job demands", "talent marketplace", "candidate briefs", "direct hire", "job search", "JobQuip"],
    },
  });
}

export const revalidate = 60;

export default async function JobDemandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  let demands: any[] = [];
  
  try {
    demands = await prisma.job_demands.findMany({
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
        users: { select: { name: true, avatar: true } },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch job demands:", error);
    demands = [];
  }
    
  return <JobDemandsClient initialDemands={demands} locale={locale} />;
}
