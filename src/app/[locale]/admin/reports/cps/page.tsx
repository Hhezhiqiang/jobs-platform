import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DollarSign, TrendingUp, Wallet, ArrowUpCircle, PiggyBank, ShoppingCart } from "lucide-react";
import { StatCard } from "@/components/admin";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default async function AdminCpsReportPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  const sp = await searchParams;
  const defaults = getDefaultRange();
  const startDate = sp.startDate || defaults.start;
  const endDate = sp.endDate || defaults.end;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const [ordersAgg, commissionAgg, withdrawalsAgg, adjustmentsAgg] = await Promise.all([
    prisma.contact_unlock_orders.aggregate({
      where: { status: "PAID", createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.commission_records.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ["AVAILABLE", "WITHDRAWN"] },
      },
      _sum: { commissionAmount: true },
      _count: { id: true },
    }),
    prisma.withdrawal_records.aggregate({
      where: {
        status: { in: ["PENDING", "APPROVED", "TRANSFERRING", "COMPLETED"] },
        requestedAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.commission_adjustments.aggregate({
      where: { createdAt: { gte: start, lte: end }, type: "REFUND" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const gmv = Number(ordersAgg._sum.amount || 0);
  const commissionPaid = Number(commissionAgg._sum.commissionAmount || 0);
  const withdrawalsPending = Number(withdrawalsAgg._sum.amount || 0);
  const refundClawbacks = Number(adjustmentsAgg._sum.amount || 0);
  const netProfit = gmv - commissionPaid;

  const formatValue = (value: number, suffix: string) => {
    const num = typeof value === "number" && value % 1 !== 0 ? value.toFixed(2) : value.toLocaleString();
    return `${num} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <h1 className="text-2xl font-bold text-gray-900">CPS 数据报表</h1>

      {/* 日期筛选 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form method="GET" className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="px-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="px-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            查询
          </button>
        </form>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="GMV"
          value={formatValue(gmv, "CNY")}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="已支付佣金"
          value={formatValue(commissionPaid, "USDT")}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="提现申请金额"
          value={formatValue(withdrawalsPending, "USDT")}
          icon={Wallet}
          color="purple"
        />
        <StatCard
          title="退款追回"
          value={formatValue(refundClawbacks, "USDT")}
          icon={ArrowUpCircle}
          color="orange"
        />
        <StatCard
          title="平台净收入"
          value={formatValue(netProfit, "CNY")}
          icon={PiggyBank}
          color="green"
        />
        <StatCard
          title="成交订单数"
          value={`${ordersAgg._count.id} 笔`}
          icon={ShoppingCart}
          color="blue"
        />
      </div>

      {/* 公式说明 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">公式说明</h2>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>
            平台净收入（CNY）= GMV（CNY）- 已支付佣金（USDT 按当前汇率折算或统一直接减，此处为简化公式展示）
          </li>
          <li>
            GMV：统计周期内岗位联系方式解锁订单的成交总额，单位 CNY
          </li>
          <li>
            已支付佣金：统计周期内产生且状态为 AVAILABLE / WITHDRAWN 的佣金总额，单位 USDT
          </li>
          <li>
            提现申请金额：统计周期内所有提现申请（含未处理）的金额总和，单位 USDT
          </li>
          <li>
            退款追回：因用户退款或订单争议由平台追回的佣金金额，单位 USDT
          </li>
        </ul>
      </div>
    </div>
  );
}
