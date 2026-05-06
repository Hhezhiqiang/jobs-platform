export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedPromoter } from "@/lib/promoter-auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function GET() {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  return NextResponse.json({
    success: true,
    promoter: {
      id: promoter.id,
      name: promoter.name,
      email: promoter.email,
      phone: promoter.phone,
      walletAddress: promoter.walletAddress,
      defaultRate: Number(promoter.defaultRate),
      status: promoter.status,
      availableBalance: Number(promoter.availableBalance),
      frozenBalance: Number(promoter.frozenBalance),
      withdrawnBalance: Number(promoter.withdrawnBalance),
      totalEarnings: Number(promoter.totalEarnings),
      createdAt: promoter.createdAt,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  try {
    const body = await request.json();
    const { walletAddress } = body;

    const updateData: Record<string, any> = {};
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;

    const updated = await prisma.promoters.update({
      where: { id: promoter.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, promoter: updated });
  } catch (error) {
    logger.error("Promoter update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
