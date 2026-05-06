export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { markOrderPaid, markOrderRefunded } from "@/lib/promoter";

/**
 * 支付回调占位接口
 * =================
 * 等待用户提供收款 API 文档后填充逻辑。
 *
 * 预期流程：
 * 1. 校验回调签名（根据收款服务商要求）
 * 2. 查找对应 ContactUnlockOrder
 * 3. 若支付成功：调用 markOrderPaid(orderId)
 * 4. 若退款/争议：调用 markOrderRefunded(orderId)
 * 5. 返回服务商要求的响应格式
 */

export async function POST(request: Request) {
  try {
    // TODO: 接入收款服务商 webhook
    const body = await request.json().catch(() => ({}));
    if (process.env.NODE_ENV === "development") {
       
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
