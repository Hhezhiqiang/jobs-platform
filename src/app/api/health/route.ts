import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check Prisma
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.prisma = "OK";
  } catch (e: any) {
    checks.prisma = `FAIL: ${e.message}`;
  }

  return NextResponse.json({ status: "ok", checks });
}
