import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics/geo - 获取用户地理位置统计
export async function GET(request: NextRequest) {
  try {
    // 1. 检查认证
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 获取参数
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // 3. 获取所有原始数据，然后在内存中处理
    const pageViews = await prisma.page_views.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ip: {
          not: null,
        },
      },
      select: {
        country: true,
        city: true,
        ip: true,
        createdAt: true,
      },
    });

    // 4. 在内存中统计数据
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
      const dayCountries = dailyMap.get(dateStr)!;
      dayCountries.set(country, (dayCountries.get(country) || 0) + 1);

      // 国家-城市映射
      if (!countryCityMap.has(country)) {
        countryCityMap.set(country, new Map());
      }
      const countryCities = countryCityMap.get(country)!;
      countryCities.set(city, (countryCities.get(city) || 0) + 1);
    }

    // 5. 整理国家数据
    const countries = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        uniqueIps: data.ips.size,
      }))
      .sort((a, b) => b.count - a.count);

    const totalViews = countries.reduce((sum, c) => sum + c.count, 0);
    const uniqueIps = new Set(pageViews.map(v => v.ip).filter(Boolean)).size;

    // 添加百分比
    const countriesWithPercentage = countries.map(c => ({
      ...c,
      percentage: totalViews > 0
        ? ((c.count / totalViews) * 100).toFixed(2) + "%"
        : "0%",
    }));

    // 6. 整理城市数据
    const cities = Array.from(cityMap.entries())
      .map(([key, data]) => ({
        city: key.split("-")[0],
        country: data.country,
        count: data.count,
        uniqueIps: data.ips.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // 7. 整理每日数据
    const dailyBreakdown: Array<{ date: string; country: string; count: number }> = [];
    for (const [date, countryCounts] of dailyMap) {
      for (const [country, count] of countryCounts) {
        dailyBreakdown.push({ date, country, count });
      }
    }
    dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

    // 8. 整理各国TOP城市
    const topCitiesByCountry = Array.from(countryCityMap.entries())
      .map(([country, cityCounts]) => {
        const sortedCities = Array.from(cityCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        return { country, cities: sortedCities };
      })
      .filter(c => c.cities.length > 0);

    const response = {
      summary: {
        totalViews,
        uniqueCountries: countries.length,
        uniqueIps,
        period: `${days}天`,
      },
      countries: countriesWithPercentage,
      cities,
      dailyBreakdown,
      topCitiesByCountry,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Geo API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geo analytics data", details: String(error) },
      { status: 500 }
    );
  }
}
