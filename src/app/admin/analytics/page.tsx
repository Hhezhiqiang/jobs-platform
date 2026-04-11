import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/analytics";
import AnalyticsClient from "./client";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 获取分析数据
  const data = await getAnalyticsOverview();

  return <AnalyticsClient data={data} />;
}
