export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommission } from "@/lib/promoter";
import { TransactionType } from "@prisma/client";

// 查看联系方式的固定定价（人民币 CNY）
const CONTACT_UNLOCK_PRICE = 5;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "缺少 jobId" }, { status: 400 });
    }

    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });

    if (!job || job.status !== "ACTIVE") {
      return NextResponse.json({ error: "该岗位已下架或不存在" }, { status: 400 });
    }

    const userId = session.user.id;
    const price = Number(process.env.CONTACT_UNLOCK_PRICE || CONTACT_UNLOCK_PRICE);

    // 检查是否已解锁
    const existingPaid = await prisma.contact_unlock_orders.findFirst({
      where: { userId, jobId, status: "PAID" },
    });

    if (existingPaid) {
      return NextResponse.json({
        success: true,
        orderId: existingPaid.id,
        alreadyUnlocked: true,
        message: "您已解锁该职位联系方式",
      });
    }

    // 查询用户余额
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || Number(user.balance) < price) {
      return NextResponse.json(
        { error: "余额不足，请先充值", code: "INSUFFICIENT_BALANCE", price },
        { status: 402 }
      );
    }

    // 扣款、创建解锁记录、生成佣金（事务）
    const result = await prisma.$transaction(async (tx) => {
      // 1. 扣减余额
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: { balance: { decrement: price } },
      });

      // 2. 创建余额流水
      const txRecord = await tx.balance_transactions.create({
        data: {
          userId,
          type: TransactionType.DEDUCTION,
          amount: -price,
          balanceAfter: updatedUser.balance,
          description: `解锁岗位联系方式 #${jobId}`,
        },
      });

      // 3. 创建解锁订单
      const order = await tx.contact_unlock_orders.create({
        data: {
          userId,
          jobId,
          amount: price,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // 关联流水与订单（BalanceTransaction 持有 orderId）
      await tx.balance_transactions.update({
        where: { id: txRecord.id },
        data: { orderId: order.id },
      });

      return { order, newBalance: updatedUser.balance };
    });

    // 4. 生成佣金（放到事务外，避免佣金异常影响主交易）
    try {
      await createCommission(result.order.id, userId, price);
    } catch (err) {
      console.error("Commission creation failed (non-blocking):", err);
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      newBalance: Number(result.newBalance),
      message: "解锁成功",
    });
  } catch (error) {
    console.error("Contact unlock order error:", error);
    return NextResponse.json({ error: "解锁失败，请稍后重试" }, { status: 500 });
  }
}
