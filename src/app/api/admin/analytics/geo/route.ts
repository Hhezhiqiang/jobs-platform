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
    console.log("[Geo API] Session:", session ? "authenticated" : "none");
    
    if (!session || session.user?.role !== "ADMIN") {
      console.log("[Geo API] Unauthorized - role:", session?.user?.role);
      return NextResponse.json(
        { error: "Unauthorized", role: session?.user?.role },
        { status: 401 }
      );
    }

    // 2. 获取参数
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());
    
    console.log("[Geo API] Query params:", { days, startDate, endDate });

    // 3. 检查数据库连接
    let totalCount = 0;
    try {
      totalCount = await prisma.page_views.count();
      console.log("[Geo API] Total page_views count:", totalCount);
    } catch (dbError) {
      console.error("[Geo API] Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: String(dbError) },
        { status: 500 }
      );
    }

    // 4. 国家统计（简化版，先不查STRING_AGG）
    let countryStats: Array<{ country: string; count: bigint; uniqueIps: bigint }> = [];
    try {
      countryStats = await prisma.$queryRaw`
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
        LIMIT 20
      `;
      console.log("[Geo API] Country stats count:", countryStats.length);
    } catch (error) {
      console.error("[Geo API] Country stats error:", error);
      // 继续执行，返回空数据
    }

    // 5. 城市统计
    let cityStats: Array<{ city: string; country: string; count: bigint; uniqueIps: bigint }> = [];
    try {
      cityStats = await prisma.$queryRaw`
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
      console.log("[Geo API] City stats count:", cityStats.length);
    } catch (error) {
      console.error("[Geo API] City stats error:", error);
    }

    // 6. 总访问量统计
    let totalStats: Array<{ totalViews: bigint; uniqueCountries: bigint; uniqueIps: bigint }> = [];
    try {
      totalStats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as totalViews,
          COUNT(DISTINCT COALESCE(NULLIF(country, ''), 'Unknown')) as uniqueCountries,
          COUNT(DISTINCT ip) as uniqueIps
        FROM page_views
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND ip IS NOT NULL
      `;
    } catch (error) {
      console.error("[Geo API] Total stats error:", error);
    }

    // 7. 每日统计（简化）
    let dailyGeoStats: Array<{ date: Date; country: string; count: bigint }> = [];
    try {
      dailyGeoStats = await prisma.$queryRaw`
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
    } catch (error) {
      console.error("[Geo API] Daily stats error:", error);
    }

    // 8. 各国TOP城市（可能不支持STRING_AGG，需要特殊处理）
    let topCitiesByCountry: Array<{ country: string; topCities: string }> = [];
    try {
      topCitiesByCountry = await prisma.$queryRaw`
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
    } catch (error) {
      console.error("[Geo API] Top cities error (STRING_AGG may not be supported):", error);
      // 使用替代方案查询
      try {
        const rawCities = await prisma.$queryRaw`
          SELECT 
            COALESCE(NULLIF(country, ''), 'Unknown') as country,
            COALESCE(NULLIF(city, ''), 'Unknown') as city,
            COUNT(*) as count
          FROM page_views
          WHERE "createdAt" >= ${startDate} 
            AND "createdAt" <= ${endDate}
            AND ip IS NOT NULL
          GROUP BY country, city
          ORDER BY count DESC
          LIMIT 100
        `;
        // 手动聚合
        const cityMap = new Map<string, Array<{ name: string; count: number }>>();
        for (const row of rawCities as Array<{ country: string; city: string; count: bigint }>) {
          if (!cityMap.has(row.country)) {
            cityMap.set(row.country, []);
          }
          const cities = cityMap.get(row.country)!;
          if (cities.length < 5) {
            cities.push({ name: row.city, count: Number(row.count) });
          }
        }
        topCitiesByCountry = Array.from(cityMap.entries()).map(([country, cities]) => ({
          country,
          topCities: cities.map(c => `${c.name}:${c.count}`).join(','),
        }));
      } catch (fallbackError) {
        console.error("[Geo API] Fallback cities error:", fallbackError);
      }
    }

    const summary = totalStats[0] || { totalViews: BigInt(0), uniqueCountries: BigInt(0), uniqueIps: BigInt(0) };

    const response = {
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
        cities: c.topCities ? c.topCities.split(',').map(cityStr => {
          const [name, count] = cityStr.split(':');
          return { name, count: parseInt(count) || 0 };
        }) : [],
      })),
    };

    console.log("[Geo API] Response prepared successfully");
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Geo API] Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geo analytics data", details: String(error) },
      { status: 500 }
    );
  }
}
