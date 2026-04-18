import { prisma } from "@/lib/prisma";

// IP地理位置缓存（内存缓存，避免重复查询）
const geoCache = new Map<string, { country: string; city: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

interface GeoLocation {
  country: string;
  city: string;
}

// 简单的IP地理位置解析
// 使用 ip-api.com 服务（非商业用途 1000次/天免费额度）
async function fetchGeoLocation(ip: string): Promise<GeoLocation | null> {
  // 本地IP或私有IP返回 Local
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip === "::1"
  ) {
    return { country: "Local", city: "Local" };
  }

  // 检查缓存
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { country: cached.country, city: cached.city };
  }

  try {
    // 使用 ip-api.com 免费API
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,city,regionName`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobPlatform/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // ip-api 返回格式：成功时 status="success"，失败时 status="fail"
    if (data.status === "fail") {
      console.warn(`[Geo] Lookup failed for ${ip}: ${data.message}`);
      // 如果是配额超限，暂时返回 Unknown，避免无限重试
      if (data.message?.includes("over quota")) {
        return { country: "Unknown", city: "Unknown" };
      }
      return null;
    }

    const result: GeoLocation = {
      country: data.country || "Unknown",
      city: data.city || data.regionName || "Unknown",
    };

    // 存入缓存
    geoCache.set(ip, { ...result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`[Geo] Network error for ${ip}:`, error);
    return null;
  }
}

// 更新 page_views 记录的地理位置信息
export async function updatePageViewGeoLocation(viewId: string, ip: string): Promise<void> {
  try {
    const geo = await fetchGeoLocation(ip);
    if (!geo) return;

    await prisma.page_views.update({
      where: { id: viewId },
      data: {
        country: geo.country,
        city: geo.city,
      },
    });
  } catch (error) {
    console.error("Failed to update page view geo location:", error);
  }
}

// 批量更新历史数据的地理位置（后台任务用）
export async function batchUpdateGeoLocations(limit: number = 100): Promise<number> {
  try {
    // 获取没有地理位置信息的记录
    const views = await prisma.page_views.findMany({
      where: {
        OR: [{ country: null }, { country: "" }],
        ip: { not: null },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    let updated = 0;
    for (const view of views) {
      if (!view.ip) continue;
      
      const geo = await fetchGeoLocation(view.ip);
      if (geo) {
        await prisma.page_views.update({
          where: { id: view.id },
          data: {
            country: geo.country,
            city: geo.city,
          },
        });
        updated++;
        
        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return updated;
  } catch (error) {
    console.error("Batch geo update error:", error);
    return 0;
  }
}

// 获取已知地理位置统计概览
export async function getGeoStats(): Promise<{
  totalWithGeo: number;
  totalWithoutGeo: number;
  coverage: string;
}> {
  const [withGeo, withoutGeo] = await Promise.all([
    prisma.page_views.count({
      where: {
        AND: [{ country: { not: null } }, { country: { not: "" } }],
      },
    }),
    prisma.page_views.count({
      where: {
        OR: [{ country: null }, { country: "" }],
        ip: { not: null },
      },
    }),
  ]);

  const total = withGeo + withoutGeo;
  return {
    totalWithGeo: withGeo,
    totalWithoutGeo: withoutGeo,
    coverage: total > 0 ? ((withGeo / total) * 100).toFixed(1) + "%" : "0%",
  };
}
