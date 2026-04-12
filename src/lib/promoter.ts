import { prisma } from "./prisma";
import { CommissionStatus, PromoterStatus, Prisma } from "@prisma/client";

const PROMO_COOKIE_NAME = "__promo_ref";
const PROMO_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

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
  const link = await prisma.promoterLink.findUnique({
    where: { code: promoCode },
    include: { promoter: true },
  });

  if (!link || link.promoter.status !== PromoterStatus.ACTIVE) return;

  // 终身锁客：只绑定首次注册
  const existing = await prisma.userReferral.findUnique({
    where: { userId },
  });
  if (existing) return;

  await prisma.userReferral.create({
    data: {
      userId,
      promoterId: link.promoterId,
      linkId: link.id,
      referralCode: promoCode,
    },
  });

  // 增加链接注册计数
  await prisma.promoterLink.update({
    where: { id: link.id },
    data: { registerCount: { increment: 1 } },
  });
}

// 计算佣金比例：优先使用链接自定义比例，否则使用推广者默认比例
export async function getCommissionRate(linkId?: string | null): Promise<number> {
  if (!linkId) return 0;
  const link = await prisma.promoterLink.findUnique({
    where: { id: linkId },
    include: { promoter: true },
  });
  if (!link) return 0;
  return Number(link.customRate ?? link.promoter.defaultRate);
}

// 创建佣金记录（支付成功后调用）
export async function createCommission(
  orderId: string,
  userId: string,
  orderAmount: number | Prisma.Decimal
) {
  // 幂等：已存在则直接返回
  const existing = await prisma.commissionRecord.findUnique({
    where: { orderId },
  });
  if (existing) return existing;

  const referral = await prisma.userReferral.findUnique({
    where: { userId },
  });
  if (!referral) return;

  const rate = await getCommissionRate(referral.linkId);
  if (rate <= 0) return;

  const amountNum = Number(orderAmount);
  const commissionAmount = Number((amountNum * (rate / 100)).toFixed(8));
  const availableAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // T+1

  const commission = await prisma.$transaction(async (tx) => {
    const created = await tx.commissionRecord.create({
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

    await tx.promoterLink.update({
      where: { id: referral.linkId },
      data: {
        orderCount: { increment: 1 },
        gmv: { increment: amountNum },
      },
    });

    await tx.promoter.update({
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

// 佣金解冻 Cron 逻辑
export async function settleCommissions(): Promise<number> {
  const now = new Date();
  const frozenRecords = await prisma.commissionRecord.findMany({
    where: {
      status: CommissionStatus.FROZEN,
      availableAt: { lte: now },
    },
  });

  if (frozenRecords.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const record of frozenRecords) {
      await tx.promoter.update({
        where: { id: record.promoterId },
        data: {
          frozenBalance: { decrement: record.commissionAmount },
          availableBalance: { increment: record.commissionAmount },
        },
      });

      await tx.commissionRecord.update({
        where: { id: record.id },
        data: { status: CommissionStatus.AVAILABLE },
      });
    }
  });

  return frozenRecords.length;
}

// 退款/争议追回佣金
export async function clawbackCommission(orderId: string) {
  const commission = await prisma.commissionRecord.findFirst({
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
      await tx.promoter.update({
        where: { id: commission.promoterId },
        data: {
          [balanceField]: { decrement: commission.commissionAmount },
          totalEarnings: { decrement: commission.commissionAmount },
        },
      });
    } else if (commission.status === CommissionStatus.WITHDRAWN) {
      // 已提现的佣金追回：直接扣 availableBalance（允许负余额，记录为债务）
      await tx.promoter.update({
        where: { id: commission.promoterId },
        data: {
          availableBalance: { decrement: commission.commissionAmount },
          totalEarnings: { decrement: commission.commissionAmount },
        },
      });
    }

    await tx.commissionAdjustment.create({
      data: {
        commissionRecordId: commission.id,
        promoterId: commission.promoterId,
        amount: commission.commissionAmount,
        reason: "订单退款追回",
        type: "REFUND",
      },
    });

    await tx.commissionRecord.update({
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

    const found = await prisma.promoterLink.findUnique({ where: { code } });
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
  const order = await prisma.contactUnlockOrder.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") {
    // 幂等：已支付则直接返回
    return order;
  }

  const updated = await prisma.contactUnlockOrder.update({
    where: { id: orderId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // 生成佣金记录
  await createCommission(updated.id, updated.userId, updated.amount);

  return updated;
}

export async function markOrderRefunded(orderId: string) {
  await prisma.contactUnlockOrder.update({
    where: { id: orderId },
    data: { status: "REFUNDED" },
  });
  await clawbackCommission(orderId);
}
