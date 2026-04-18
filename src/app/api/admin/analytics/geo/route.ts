import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const pageViews = await prisma.page_views.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ip: { not: null },
      },
      select: {
        country: true,
        city: true,
        ip: true,
        createdAt: true,
      },
    });

    // 统计数据
    const countryMap = new Map<string, { count: number; ips: Set<string> }>();
    const cityMap = new Map<string, { count: number; ips: Set<string>; country: string }>();
    const dailyMap = new Map<string, Map<string, number>>();
    const countryCityMap = new Map<string, Map<string, number>>();

    for (const view of pageViews) {
      const country = view.country || "Unknown";
      const city = view.city || "Unknown";
      const ip = view.ip || "unknown";
      const dateStr = view.createdAt.toISOString().split("T")[0];

      // 国家统计
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, ips: new Set() });
      }
      const countryData = countryMap.get(country)!;
      countryData.count++;
      countryData.ips.add(ip);

      // 城市统计
      const cityKey = `${city}-${country}`;
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, { count: 0, ips: new Set(), country });
      }
      const cityData = cityMap.get(cityKey)!;
      cityData.count++;
      cityData.ips.add(ip);

      // 每日统计
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, new Map());
      }
      const dayCountryMap = dailyMap.get(dateStr)!;
      dayCountryMap.set(country, (dayCountryMap.get(country) || 0) + 1);

      // 国家城市统计
      if (!countryCityMap.has(country)) {
        countryCityMap.set(country, new Map());
      }
      const cityCountMap = countryCityMap.get(country)!;
      cityCountMap.set(city, (cityCountMap.get(city) || 0) + 1);
    }

    const totalViews = pageViews.length;
    const uniqueIps = new Set(pageViews.map(v => v.ip)).size;

    // 格式化国家数据
    const countries = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        uniqueIps: data.ips.size,
        percentage: totalViews > 0 ? ((data.count / totalViews) * 100).toFixed(2) + "%" : "0%",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // 格式化城市数据
    const cities = Array.from(cityMap.entries())
      .map(([key, data]) => ({
        city: key.split("-")[0],
        country: data.country,
        count: data.count,
        uniqueIps: data.ips.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // 格式化每日数据
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, countryCounts]) => ({
        date,
        countries: Object.fromEntries(countryCounts),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 格式化国家城市数据
    const topCitiesByCountry = Array.from(countryCityMap.entries())
      .map(([country, cityCounts]) => ({
        country,
        cities: Array.from(cityCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .filter(c => c.cities.length > 0);

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueIps,
        uniqueCountries: countries.length,
        period: `${days}天`,
      },
      countries,
      cities,
      dailyBreakdown,
      topCitiesByCountry,
    });
  } catch (error: any) {
    console.error("[geo-analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geo analytics", message: error.message },
      { status: 500 }
    );
  }
}
