import { prisma } from "./prisma";
import { logger } from '@/lib/logger';
import { CommissionStatus, PromoterStatus, Prisma } from "@prisma/client";

const PROMO_COOKIE_NAME = "__promo_ref";
const PROMO_COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60; // 永久（10年，浏览器最大支持值）

export const PROMOTER_COOKIE = {
  name: PROMO_COOKIE_NAME,
  maxAge: PROMO_COOKIE_MAX_AGE,
};

// 解析请求中的推广 Cookie
export function getPromoRef(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${PROMO_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// 绑定用户与推广者关系（注册时调用）
export async function bindUserReferral(userId: string, promoCode: string) {
  const link = await prisma.promoter_links.findUnique({
    where: { code: promoCode },
    include: { promoters: true },
  });

  if (!link || link.promoters.status !== PromoterStatus.ACTIVE) return;

  // 终身锁客：只绑定首次注册
  const existing = await prisma.user_referrals.findUnique({
    where: { userId },
  });
  if (existing) return;

  await prisma.user_referrals.create({
    data: {
      userId,
      promoterId: link.promoterId,
      linkId: link.id,
      referralCode: promoCode,
    },
  });

  // 增加链接注册计数
  await prisma.promoter_links.update({
    where: { id: link.id },
    data: { registerCount: { increment: 1 } },
  });
}

// 计算佣金比例：优先使用链接自定义比例，否则使用推广者默认比例
export async function getCommissionRate(linkId?: string | null): Promise<number> {
  if (!linkId) return 0;
  const link = await prisma.promoter_links.findUnique({
    where: { id: linkId },
    include: { promoters: true },
  });
  if (!link) return 0;
  return Number(link.customRate ?? link.promoters.defaultRate);
}

// 创建佣金记录（支付成功后调用）
export async function createCommission(
  orderId: string,
  userId: string,
  orderAmount: number | Prisma.Decimal
) {
  // 幂等：已存在则直接返回
  const existing = await prisma.commission_records.findUnique({
    where: { orderId },
  });
  if (existing) return existing;

  const referral = await prisma.user_referrals.findUnique({
    where: { userId },
  });
  if (!referral) return;

  const rate = await getCommissionRate(referral.linkId);
  if (rate <= 0) return;

  const amountNum = Number(orderAmount);
  const commissionAmount = Number((amountNum * (rate / 100)).toFixed(8));
  const availableAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // T+1

  const commission = await prisma.$transaction(async (tx) => {
    const created = await tx.commission_records.create({
      data: {
        orderId,
        promoterId: referral.promoterId,
        linkId: referral.linkId,
        userId,
        orderAmount: new Prisma.Decimal(orderAmount),
        rate: new Prisma.Decimal(rate),
        commissionAmount: new Prisma.Decimal(commissionAmount.toFixed(8)),
        status: CommissionStatus.FROZEN,
        availableAt,
      },
    });

    await tx.promoter_links.update({
      where: { id: referral.linkId },
      data: {
        orderCount: { increment: 1 },
        gmv: { increment: amountNum },
      },
    });

    await tx.promoters.update({
      where: { id: referral.promoterId },
      data: {
        frozenBalance: { increment: commissionAmount },
        totalEarnings: { increment: commissionAmount },
      },
    });

    return created;
  });

  return commission;
}

// 佣金解冻 Cron 逻辑（带重试 + 幂等性保证）
export async function settleCommissions(maxRetries = 3): Promise<number> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const now = new Date();

      // 幂等性：使用事务确保原子性，重复调用不会产生副作用
      const frozenRecords = await prisma.commission_records.findMany({
        where: {
          status: CommissionStatus.FROZEN,
          availableAt: { lte: now },
        },
      });

      if (frozenRecords.length === 0) return 0;

      await prisma.$transaction(async (tx) => {
        for (const record of frozenRecords) {
          // 幂等：只更新仍为 FROZEN 状态的记录
          const current = await tx.commission_records.findUnique({
            where: { id: record.id },
            select: { status: true },
          });
          if (current?.status !== CommissionStatus.FROZEN) continue;

          await tx.promoters.update({
            where: { id: record.promoterId },
            data: {
              frozenBalance: { decrement: record.commissionAmount },
              availableBalance: { increment: record.commissionAmount },
            },
          });

          await tx.commission_records.update({
            where: { id: record.id },
            data: { status: CommissionStatus.AVAILABLE },
          });
        }
      });

      return frozenRecords.length;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // 指数退避: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 2000;
        logger.error(
          `[settleCommissions] 重试 ${attempt + 1}/${maxRetries} 在 ${delay}ms 后`,
          error,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error("settleCommissions failed after retries");
}

// 退款/争议追回佣金
export async function clawbackCommission(orderId: string) {
  const commission = await prisma.commission_records.findFirst({
    where: { orderId },
  });
  if (!commission || commission.status === CommissionStatus.CLAWED_BACK) return;

  await prisma.$transaction(async (tx) => {
    // 根据佣金当前状态，从对应余额池扣减
    const balanceField: string | null =
      commission.status === CommissionStatus.FROZEN
        ? "frozenBalance"
        : commission.status === CommissionStatus.AVAILABLE
        ? "availableBalance"
        : null;

    if (balanceField) {
      await tx.promoters.update({
        where: { id: commission.promoterId },
        data: {
          [balanceField]: { decrement: commission.commissionAmount },
          totalEarnings: { decrement: commission.commissionAmount },
        },
      });
    } else if (commission.status === CommissionStatus.WITHDRAWN) {
      // 已提现的佣金追回：直接扣 availableBalance（允许负余额，记录为债务）
      await tx.promoters.update({
        where: { id: commission.promoterId },
        data: {
          availableBalance: { decrement: commission.commissionAmount },
          totalEarnings: { decrement: commission.commissionAmount },
        },
      });
    }

    await tx.commission_adjustments.create({
      data: {
        commissionRecordId: commission.id,
        promoterId: commission.promoterId,
        amount: commission.commissionAmount,
        reason: "订单退款追回",
        type: "REFUND",
      },
    });

    await tx.commission_records.update({
      where: { id: commission.id },
      data: { status: CommissionStatus.CLAWED_BACK },
    });
  });
}

// 生成唯一推广码
export async function generateUniquePromoCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let exists = true;
  while (exists) {
    code =
      "REF_" +
      Array.from({ length: 7 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("");

    const found = await prisma.promoter_links.findUnique({ where: { code } });
    exists = !!found;
  }
  return code;
}

// 校验 TRC-20 地址（简单长度校验，不严格）
export function isValidTrc20Address(address: string): boolean {
  return /^T[a-zA-Z0-9]{33}$/.test(address);
}

// 支付相关辅助函数（供 webhook 调用）
export async function markOrderPaid(orderId: string) {
  const order = await prisma.contact_unlock_orders.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") {
    // 幂等：已支付则直接返回
    return order;
  }

  const updated = await prisma.contact_unlock_orders.update({
    where: { id: orderId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // 生成佣金记录
  await createCommission(updated.id, updated.userId, updated.amount);

  return updated;
}

export async function markOrderRefunded(orderId: string) {
  await prisma.contact_unlock_orders.update({
    where: { id: orderId },
    data: { status: "REFUNDED" },
  });
  await clawbackCommission(orderId);
}
