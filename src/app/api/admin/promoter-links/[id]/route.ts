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
    const { customRate, status } = body;

    const updateData: Record<string, any> = {};
    if (customRate !== undefined) {
      const rate = Number(customRate);
      if (rate < 1 || rate > 98) {
        return NextResponse.json({ error: "比例需在 1%~98% 之间" }, { status: 400 });
      }
      updateData.customRate = rate;
    }
    if (status !== undefined) updateData.status = status;

    const link = await prisma.promoter_links.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("Admin promoter link update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
