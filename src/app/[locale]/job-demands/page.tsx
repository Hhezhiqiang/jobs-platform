import { Metadata } from "next";
import JobDemandsClient from "./job-demands-client";

const SITE_NAME = "JobQuip";
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
  
  try {
    const res = await fetch(`${SITE_URL}/api/job-demands`, { cache: "no-store" });
    const result = await res.json();
    
    return <JobDemandsClient initialDemands={result.data || []} locale={locale} />;
  } catch {
    return <JobDemandsClient initialDemands={[]} locale={locale} />;
  }
}
