export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = decodeURIComponent(searchParams.get("id") || request.nextUrl.pathname.split("/").pop() || "");

    if (!id) {
      return NextResponse.json({ error: "Job not found" }, { status: 400 });
    }

    const job = await prisma.jobs.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ id }, { slug: id }],
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    logger.error("Get job error:", error);
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 });
  }
}
