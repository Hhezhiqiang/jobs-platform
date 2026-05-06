import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { batchUpdateGeoLocations, getGeoStats } from "@/lib/geo-location";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";

// GET: 获取地理位置数据覆盖情况
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const stats = await getGeoStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Geo stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geo stats" },
      { status: 500 }
    );
  }
}

// POST: 批量更新地理位置数据
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const updated = await batchUpdateGeoLocations(limit);
    
    return NextResponse.json({
      success: true,
      updated,
      message: `成功更新 ${updated} 条记录的地理位置信息`,
    });
  } catch (error) {
    logger.error("Batch geo update API error:", error);
    return NextResponse.json(
      { error: "Failed to update geo locations" },
      { status: 500 }
    );
  }
}
