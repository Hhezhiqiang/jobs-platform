import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/analytics";
import AnalyticsClient from "./client";

export const dynamic = "force-dynamic";
export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/unauthorized`);
  }

  // 获取分析数据
  const data = await getAnalyticsOverview();

  return <AnalyticsClient data={data} />;
}
