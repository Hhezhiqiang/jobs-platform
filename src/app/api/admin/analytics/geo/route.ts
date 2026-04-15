import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics/geo - 获取用户地理位置统计
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取时间范围参数
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // 1. 国家统计
    const countryStats = await prisma.$queryRaw<
      Array<{ country: string; count: bigint; uniqueIps: bigint }>
    >`
      SELECT 
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        COUNT(*) as count,
        COUNT(DISTINCT ip) as uniqueIps
      FROM page_views
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND ip IS NOT NULL
      GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
      ORDER BY count DESC
    `;

    // 2. 城市统计（仅取前50）
    const cityStats = await prisma.$queryRaw<
      Array<{ city: string; country: string; count: bigint; uniqueIps: bigint }>
    >`
      SELECT 
        COALESCE(NULLIF(city, ''), 'Unknown') as city,
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        COUNT(*) as count,
        COUNT(DISTINCT ip) as uniqueIps
      FROM page_views
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND ip IS NOT NULL
      GROUP BY COALESCE(NULLIF(city, ''), 'Unknown'), COALESCE(NULLIF(country, ''), 'Unknown')
      ORDER BY count DESC
      LIMIT 50
    `;

    // 3. 按日期统计
    const dailyGeoStats = await prisma.$queryRaw<
      Array<{ date: Date; country: string; count: bigint }>
    >`
      SELECT 
        DATE("createdAt") as date,
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        COUNT(*) as count
      FROM page_views
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND ip IS NOT NULL
      GROUP BY DATE("createdAt"), COALESCE(NULLIF(country, ''), 'Unknown')
      ORDER BY date ASC, count DESC
    `;

    // 4. 总访问量统计
    const totalStats = await prisma.$queryRaw<
      Array<{ totalViews: bigint; uniqueCountries: bigint; uniqueIps: bigint }>
    >`
      SELECT 
        COUNT(*) as totalViews,
        COUNT(DISTINCT COALESCE(NULLIF(country, ''), 'Unknown')) as uniqueCountries,
        COUNT(DISTINCT ip) as uniqueIps
      FROM page_views
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND ip IS NOT NULL
    `;

    // 5. 获取每个国家的TOP城市
    const topCitiesByCountry = await prisma.$queryRaw<
      Array<{ country: string; topCities: string }>
    >`
      SELECT 
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        STRING_AGG(
          CONCAT(COALESCE(NULLIF(city, ''), 'Unknown'), ':', count::text), 
          ',' ORDER BY count DESC
        ) as topCities
      FROM (
        SELECT 
          country,
          city,
          COUNT(*) as count,
          ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(country, ''), 'Unknown') ORDER BY COUNT(*) DESC) as rn
        FROM page_views
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND ip IS NOT NULL
        GROUP BY country, city
      ) ranked
      WHERE rn <= 5
      GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
    `;

    const summary = totalStats[0] || { totalViews: BigInt(0), uniqueCountries: BigInt(0), uniqueIps: BigInt(0) };

    return NextResponse.json({
      summary: {
        totalViews: Number(summary.totalViews),
        uniqueCountries: Number(summary.uniqueCountries),
        uniqueIps: Number(summary.uniqueIps),
        period: `${days}天`,
      },
      countries: countryStats.map(c => ({
        country: c.country,
        count: Number(c.count),
        uniqueIps: Number(c.uniqueIps),
        percentage: summary.totalViews > 0 
          ? ((Number(c.count) / Number(summary.totalViews)) * 100).toFixed(2) + '%'
          : '0%'
      })),
      cities: cityStats.map(c => ({
        city: c.city,
        country: c.country,
        count: Number(c.count),
        uniqueIps: Number(c.uniqueIps),
      })),
      dailyBreakdown: dailyGeoStats.map(d => ({
        date: d.date.toISOString().split('T')[0],
        country: d.country,
        count: Number(d.count),
      })),
      topCitiesByCountry: topCitiesByCountry.map(c => ({
        country: c.country,
        cities: c.topCities.split(',').map(cityStr => {
          const [name, count] = cityStr.split(':');
          return { name, count: parseInt(count) || 0 };
        }),
      })),
    });
  } catch (error) {
    console.error("Geo analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geo analytics data" },
      { status: 500 }
    );
  }
}
