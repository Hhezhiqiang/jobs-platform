export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/plisio";
import crypto from "crypto";

const ALLOWED_AMOUNTS = [10, 30, 50, 100];

// 生成订单号
function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PLS-${userId.slice(0, 8)}-${timestamp}-${random}`;
}

// POST /api/payments/plisio/create - 创建加密货币支付订单
export async function POST(request: NextRequest) {
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

    const userId = session.user.id;
    const orderId = generateOrderId(userId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobquip.com";

    // 创建 Plisio 支付订单
    const invoice = await createInvoice({
      amount,
      currency: "CNY",
      orderName: `账户充值 ¥${amount}`,
      orderId,
      callbackUrl: `${baseUrl}/api/payments/plisio/webhook`,
      successUrl: `${baseUrl}/user/recharge?status=success`,
      cancelUrl: `${baseUrl}/user/recharge?status=cancelled`,
      email: session.user.email || undefined,
    });

    if (invoice.status !== "success" || !invoice.data) {
      console.error("Plisio invoice creation failed:", invoice);
      return NextResponse.json(
        { error: "创建支付订单失败", details: invoice.error },
        { status: 500 }
      );
    }

    // 保存订单到数据库
    await prisma.$executeRaw`
      INSERT INTO plisio_orders (
        id, user_id, plisio_invoice_id, amount, currency, status, payment_url, created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${invoice.data.invoice_id},
        ${amount},
        'CNY',
        'PENDING',
        ${invoice.data.invoice_url},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      orderId,
      plisioInvoiceId: invoice.data.invoice_id,
      paymentUrl: invoice.data.invoice_url,
      amount,
      message: "支付订单已创建",
    });
  } catch (error) {
    console.error("Plisio create order error:", error);
    return NextResponse.json(
      { error: "创建支付订单失败", details: String(error) },
      { status: 500 }
    );
  }
}
