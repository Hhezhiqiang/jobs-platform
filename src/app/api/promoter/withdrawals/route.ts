export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedPromoter } from "@/lib/promoter-auth";
import { prisma } from "@/lib/prisma";

const MIN_WITHDRAWAL = 10;

export async function GET() {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  try {
    const records = await prisma.withdrawalRecord.findMany({
      where: { promoterId: promoter.id },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        amount: true,
        walletAddress: true,
        txHash: true,
        status: true,
        remark: true,
        requestedAt: true,
        reviewedAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawals: records.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })),
    });
  } catch (error) {
    console.error("Withdrawals get error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedPromoter();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { promoter } = auth;

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || isNaN(withdrawalAmount)) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (withdrawalAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `最低提现门槛为 ${MIN_WITHDRAWAL} USDT` }, { status: 400 });
    }

    if (promoter.status !== "ACTIVE") {
      return NextResponse.json({ error: "账户未激活或已被封禁" }, { status: 403 });
    }

    if (!promoter.walletAddress) {
      return NextResponse.json({ error: "请先绑定 TRC-20 钱包地址" }, { status: 400 });
    }

    // 在事务内做余额校验与扣减，防止并发竞态
    const record = await prisma.$transaction(async (tx) => {
      // 重新读取并锁定 promoter 记录（Prisma interactive transaction 已提供隔离）
      const freshPromoter = await tx.promoter.findUnique({
        where: { id: promoter.id },
      });

      if (!freshPromoter) throw new Error("推广者不存在");

      const available = Number(freshPromoter.availableBalance);
      if (withdrawalAmount > available) {
        throw new Error("可提现余额不足");
      }

      await tx.promoter.update({
        where: { id: promoter.id },
        data: {
          availableBalance: { decrement: withdrawalAmount },
          withdrawnBalance: { increment: withdrawalAmount },
        },
      });

      return await tx.withdrawalRecord.create({
        data: {
          promoterId: promoter.id,
          amount: withdrawalAmount,
          walletAddress: freshPromoter.walletAddress!,
          status: "PENDING",
        },
      });
    });

    return NextResponse.json({ success: true, withdrawalId: record.id });
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    if (error.message === "可提现余额不足") {
      return NextResponse.json({ error: "可提现余额不足" }, { status: 400 });
    }
    return NextResponse.json({ error: "申请失败" }, { status: 500 });
  }
}
