// Plisio 加密货币支付服务
// 文档: https://plisio.net/documentation/api

const PLISIO_API_KEY = process.env.PLISIO_API_KEY;
const PLISIO_API_URL = "https://api.plisio.net/api/v1";

export interface PlisioInvoiceRequest {
  amount: number;
  currency: string;
  orderName: string;
  orderId: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
  email?: string;
}

export interface PlisioInvoiceResponse {
  status: "success" | "error";
  data?: {
    invoice_id: string;
    invoice_url: string;
    amount: string;
    currency: string;
    order_id: string;
    status: string;
  };
  error?: string;
}

/**
 * 创建 Plisio 支付发票
 */
export async function createInvoice(
  request: PlisioInvoiceRequest
): Promise<PlisioInvoiceResponse> {
  if (!PLISIO_API_KEY) {
    throw new Error("PLISIO_API_KEY not configured");
  }

  const params = new URLSearchParams({
    api_key: PLISIO_API_KEY,
    amount: request.amount.toString(),
    currency: request.currency,
    order_name: request.orderName,
    order_id: request.orderId,
    callback_url: request.callbackUrl,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    email: request.email || "",
  });

  const response = await fetch(`${PLISIO_API_URL}/invoices/new?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Plisio API error: ${response.status}`);
  }

  return response.json();
}

/**
 * 验证 Plisio 回调签名
 * Plisio 使用 HMAC-SHA256 签名回调数据
 */
export function verifyCallbackSignature(
  payload: Record<string, string>,
  signature: string
): boolean {
  if (!PLISIO_API_KEY) return false;

  // 按字母顺序排序参数
  const sortedParams = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");

  const expectedSignature = require("crypto")
    .createHmac("sha256", PLISIO_API_KEY)
    .update(sortedParams)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * 获取发票状态
 */
export async function getInvoiceStatus(invoiceId: string): Promise<PlisioInvoiceResponse> {
  if (!PLISIO_API_KEY) {
    throw new Error("PLISIO_API_KEY not configured");
  }

  const response = await fetch(
    `${PLISIO_API_URL}/invoices/${invoiceId}?api_key=${PLISIO_API_KEY}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Plisio API error: ${response.status}`);
  }

  return response.json();
}

// Plisio 支付状态映射
export type PlisioPaymentStatus =
  | "pending" // 等待支付
  | "completed" // 支付完成
  | "expired" // 订单过期
  | "error" // 支付错误
  | "mismatch"; // 金额不匹配

/**
 * 将 Plisio 状态转换为内部状态
 */
export function mapPlisioStatus(status: string): PlisioPaymentStatus {
  const statusMap: Record<string, PlisioPaymentStatus> = {
    pending: "pending",
    completed: "completed",
    expired: "expired",
    error: "error",
    mismatch: "mismatch",
    // Plisio 可能的状态值
    new: "pending",
    pending_confirmations: "pending",
    paid: "completed",
    cancelled: "expired",
  };

  return statusMap[status.toLowerCase()] || "pending";
}
