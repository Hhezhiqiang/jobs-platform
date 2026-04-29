import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeoAnalyticsClient } from "./components/geo-analytics-client";

export const metadata: Metadata = {
  title: "地理位置分析 | 管理员控制台",
  description: "查看用户国家来源、城市分布和IP访问统计",
  robots: { index: false, follow: false },
};

export default async function GeoAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">地理位置分析</h1>
      </div>
      <GeoAnalyticsClient />
    </div>
  );
}
