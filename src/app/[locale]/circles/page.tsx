import { Metadata } from "next";
import CirclesClient from "./circles-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Circles — Find collaborators on JobQuip"
      : "圈子 — 在 JobQuip 找合作机会",
    description: isEn
      ? "JobQuip Circles is a public board where members share what they're building and what they're looking for — find co-founders, project partners, or skill swaps."
      : "JobQuip 圈子是一个公开留言板，会员发布合作机会与需求，找合伙人、项目协作或技能交换。",
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com"}/${locale}/circles`,
    },
    robots: { index: true, follow: true },
  };
}

export default function CirclesPage() {
  return <CirclesClient />;
}
