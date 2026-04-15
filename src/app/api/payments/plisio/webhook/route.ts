export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPlisioStatus } from "@/lib/plisio";

/**
 * Plisio Webhook 回调处理
 * 当用户完成加密货币支付时，Plisio 会调用此接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Plisio Webhook] Received:", body);

    const {
      invoice_id,
      order_id,
      status,
      amount,
      currency,
      sign, // Plisio 签名
    } = body;

    if (!invoice_id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: 验证签名（生产环境必须启用）
    // const isValid = verifyCallbackSignature(body, sign);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // 查找订单
    const orders = await prisma.$queryRaw<
      Array<{ id: string; user_id: string; amount: number; status: string }>
    >`
      SELECT id, user_id, amount, status FROM plisio_orders
      WHERE plisio_invoice_id = ${invoice_id}
      LIMIT 1
    `;

    if (orders.length === 0) {
      console.error("[Plisio Webhook] Order not found:", invoice_id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    // 如果订单已处理，直接返回成功
    if (order.status === "COMPLETED") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const paymentStatus = mapPlisioStatus(status);

    // 更新订单状态
    await prisma.$executeRaw`
      UPDATE plisio_orders
      SET status = ${paymentStatus.toUpperCase()},
          updated_at = NOW()
      WHERE id = ${order.id}
    `;

    // 如果支付成功，更新用户余额
    if (paymentStatus === "completed") {
      // 获取用户当前余额
      const users = await prisma.$queryRaw<
        Array<{ balance: number }>
      >`
        SELECT balance FROM users WHERE id = ${order.user_id} LIMIT 1
      `;

      const currentBalance = Number(users[0]?.balance || 0);
      const newBalance = currentBalance + Number(order.amount);

      // 更新用户余额
      await prisma.$executeRaw`
        UPDATE users
        SET balance = ${newBalance}
        WHERE id = ${order.user_id}
      `;

      // 创建余额交易记录
      await prisma.$executeRaw`
        INSERT INTO balance_transactions (
          id, user_id, type, amount, balance_after, description, payment_method, plisio_order_id, created_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${order.user_id},
          'RECHARGE',
          ${order.amount},
          ${newBalance},
          '加密货币充值 - Plisio',
          'CRYPTO',
          ${order.id},
          NOW()
        )
      `;

      console.log("[Plisio Webhook] Payment completed:", {
        userId: order.user_id,
        amount: order.amount,
        newBalance,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Plisio Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// 支持 GET 请求（Plisio 有时使用 GET 回调）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const invoiceId = searchParams.get("invoice_id");

  console.log("[Plisio Webhook GET]:", { status, invoiceId });

  // 重定向到结果页面
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobs-platform-gold.vercel.app";
  
  if (status === "completed" || status === "paid") {
    return NextResponse.redirect(`${baseUrl}/user/recharge?status=success`);
  } else {
    return NextResponse.redirect(`${baseUrl}/user/recharge?status=pending`);
  }
}
