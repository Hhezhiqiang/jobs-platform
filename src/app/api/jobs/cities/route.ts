export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const cities = await prisma.jobs.findMany({
      where: {
        status: "ACTIVE",
        city: {
          not: null,
        },
      },
      select: {
        city: true,
      },
      distinct: ["city"],
      take: 500,
      orderBy: {
        city: "asc",
      },
    });

    return NextResponse.json({
      cities: cities.map((c) => c.city).filter(Boolean),
    });
  } catch (error) {
    logger.error("Failed to fetch cities:", error);
    return NextResponse.json(
      { error: "获取城市列表失败" },
      { status: 500 }
    );
  }
}
