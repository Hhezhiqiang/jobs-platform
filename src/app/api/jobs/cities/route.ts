import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cities = await prisma.job.findMany({
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
    console.error("Failed to fetch cities:", error);
    return NextResponse.json(
      { error: "获取城市列表失败" },
      { status: 500 }
    );
  }
}
