import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const positions = await prisma.ad_positions.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ positions });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
