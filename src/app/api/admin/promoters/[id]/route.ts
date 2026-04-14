export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function checkAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = checkAdmin(session);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { status, defaultRate, walletAddress } = body;

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (defaultRate !== undefined) updateData.defaultRate = Number(defaultRate);
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;

    const promoter = await prisma.promoters.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, promoter });
  } catch (error) {
    console.error("Admin promoter update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
