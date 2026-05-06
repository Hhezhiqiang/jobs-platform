export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

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
    const { status, txHash, remark } = body;

    if (!status || !["APPROVED", "REJECTED", "TRANSFERRING", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "无效状态" }, { status: 400 });
    }

    const current = await prisma.withdrawal_records.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json({ error: "提现记录不存在" }, { status: 404 });
    }

    // 防止重复处理：已经是 REJECTED/COMPLETED 的不能再改
    if (current.status === status) {
      return NextResponse.json({ error: `状态已经是 ${status}` }, { status: 400 });
    }
    if (["REJECTED", "COMPLETED"].includes(current.status)) {
      return NextResponse.json(
        { error: `该记录已${current.status === "REJECTED" ? "拒绝" : "完成"}，不能再修改` },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = { status };
    if (status === "APPROVED") {
      updateData.reviewedAt = new Date();
    }
    if (status === "REJECTED") {
      updateData.reviewedAt = new Date();
      if (!remark) {
        return NextResponse.json({ error: "拒绝时需提供原因" }, { status: 400 });
      }
      updateData.remark = remark;

      // 只有从 PENDING/APPROVED/TRANSFERRING 转为 REJECTED 时才退款
      if (["PENDING", "APPROVED", "TRANSFERRING"].includes(current.status)) {
        await prisma.promoters.update({
          where: { id: current.promoterId },
          data: {
            availableBalance: { increment: current.amount },
            withdrawnBalance: { decrement: current.amount },
          },
        });
      }
    }
    if (status === "TRANSFERRING") {
      if (!txHash) {
        return NextResponse.json({ error: "转账中需提供 TXID" }, { status: 400 });
      }
      updateData.txHash = txHash;
    }
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      if (!txHash) {
        return NextResponse.json({ error: "完成时需提供 TXID" }, { status: 400 });
      }
      updateData.txHash = txHash;
    }

    const record = await prisma.withdrawal_records.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    logger.error("Admin withdrawal update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
