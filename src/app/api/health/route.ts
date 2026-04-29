import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check Prisma
  try {
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    checks.prisma = "OK";
  } catch (e: unknown) {
    checks.prisma = `FAIL: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }

  return NextResponse.json({ status: "ok", checks });
}
