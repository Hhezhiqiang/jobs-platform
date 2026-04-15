import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/companies/search?q=xxx - 搜索公司
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!query || query.length < 2) {
      return NextResponse.json({
        companies: [],
      });
    }

    // 搜索公司（只返回已认证的公司）
    const companies = await prisma.companies.findMany({
      where: {
        AND: [
          { verificationStatus: "APPROVED" },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        location: true,
        industry: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("搜索公司失败:", error);
    return NextResponse.json(
      { error: "搜索公司失败" },
      { status: 500 }
    );
  }
}
