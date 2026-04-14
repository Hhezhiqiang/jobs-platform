import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PageProps {
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

export default async function AdminCpsReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login/admin");
  }

  const params = await searchParams;
  const defaults = getDefaultRange();
  const startDate = params.startDate || defaults.start;
  const endDate = params.endDate || defaults.end;

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

  const cards = [
    { label: "GMV", value: gmv, suffix: "CNY", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "已支付佣金", value: commissionPaid, suffix: "USDT", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "提现申请金额", value: withdrawalsPending, suffix: "USDT", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "退款追回", value: refundClawbacks, suffix: "USDT", color: "text-red-600", bg: "bg-red-50" },
    { label: "平台净收入", value: netProfit, suffix: "CNY", color: "text-green-600", bg: "bg-green-50" },
    { label: "成交订单数", value: ordersAgg._count.id, suffix: "笔", color: "text-gray-600", bg: "bg-gray-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">← 返回管理后台</Link>
            <h1 className="text-2xl font-bold">CPS 数据报表</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form method="GET" className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">查询</button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {typeof card.value === "number" && card.value % 1 !== 0
                  ? card.value.toFixed(2)
                  : card.value.toLocaleString()}{" "}
                {card.suffix}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
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
      </main>
    </div>
  );
}
