export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from '@/lib/logger';

const ALLOWED_AMOUNTS = [10, 30, 50, 100];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { error: "不支持的充值金额", allowed: ALLOWED_AMOUNTS },
        { status: 400 }
      );
    }

    // TODO: 接入支付提供商后：
    // 1. 创建支付订单
    // 2. 返回 paymentUrl 或支付参数
    // 3. 在 webhook 中确认到账并写入 BalanceTransaction + 增加 user.balance

    return NextResponse.json({
      success: true,
      amount,
      paymentUrl: null,
      message: "支付接口待接入，请联系管理员完成充值",
    });
  } catch (error) {
    logger.error("Recharge error:", error);
    return NextResponse.json({ error: "发起充值失败" }, { status: 500 });
  }
}
