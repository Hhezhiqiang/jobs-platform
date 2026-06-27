import { Metadata } from "next";
import Link from "next/link";
import { generateStaticPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata({
    path: "affiliate",
    locale,
    zh: {
      title: "推广者计划 - 分享职位赚取佣金 | JobQuip CPS",
      description: "加入 JobQuip 推广者计划，分享推广链接即可获得高额佣金。每次注册和订单都能获得分成，多劳多得，提现到 TRC-20 钱包。",
      keywords: ["JobQuip 推广", "招聘推广", "CPS", "联盟计划", "分销", "推广佣金", "TRC-20"],
    },
    en: {
      title: "Affiliate Program - Share Jobs, Earn Commission | JobQuip CPS",
      description: "Join the JobQuip affiliate program. Share your link, earn commission on every signup and order. Paid out to TRC-20.",
      keywords: ["affiliate program", "JobQuip affiliate", "CPS", "referral program", "earn commission", "job referrals"],
    },
  });
}

export default async function AffiliatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            分享职位，赚取佣金
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            加入 JobQuip 推广者计划，通过你的专属链接注册和下单，即可获取高额分成
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/promoter/register`}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              立即申请
            </Link>
            <Link
              href={`/${locale}/promoter/login`}
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30"
            >
              推广者登录
            </Link>
          </div>
        </div>
      </div>

      {/* 核心优势 */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">为什么加入推广者计划？</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "💰",
              title: "高额佣金",
              desc: "每笔订单都能获得分成，比例可定制，多劳多得，上不封顶",
            },
            {
              icon: "🔗",
              title: "专属链接",
              desc: "每个推广者拥有独立推广链接，精准追踪点击、注册和成交数据",
            },
            {
              icon: "💸",
              title: "快速提现",
              desc: "佣金自动结算至钱包，支持 TRC-20 USDT 提现，1-3 个工作日到账",
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 如何开始 */}
      <div className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">如何开始推广？</h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "提交申请", desc: "填写基本信息和 TRC-20 钱包地址，提交推广者申请" },
              { step: "2", title: "等待审核", desc: "我们将在 1-2 个工作日内审核你的申请，通过后邮件通知" },
              { step: "3", title: "获取推广链接", desc: "登录推广者后台，创建专属推广链接，可自定义返佣比例和落地页" },
              { step: "4", title: "分享赚钱", desc: "在社交媒体、博客、社群等渠道分享链接，有人注册或下单即可获得佣金" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">常见问题</h2>
        <div className="space-y-6">
          {[
            {
              q: "推广佣金怎么计算？",
              a: "佣金 = 订单金额 × 你的返佣比例。每个推广链接可以设置专属比例，默认比例由管理员设定。",
            },
            {
              q: "提现门槛是多少？",
              a: "最低提现金额为 10 USDT，支持 TRC-20 转账，平台承担手续费。",
            },
            {
              q: "推广链接有效期多久？",
              a: "推广链接长期有效，只要有人通过你的链接注册或下单，你都能获得佣金。",
            },
            {
              q: "佣金什么时候结算？",
              a: "用户完成支付后佣金即计入冻结状态，经过一定冷却期后变为可提现余额。",
            },
          ].map((item, i) => (
            <details key={i} className="bg-white border border-gray-100 rounded-xl p-6 [&_summary]:cursor-pointer [&_summary]:font-semibold [&_summary]:text-gray-900 [&_summary]:list-none [&_summary]:relative [&_summary]:pr-8 [&_summary::after]:content-['+'] [&_summary::after]:absolute [&_summary::after]:right-0 [&_summary::after]:text-xl [&_summary::after]:text-blue-600 [&_details[open]_summary::after]:content-['−']">
              <summary>{item.q}</summary>
              <p className="mt-3 text-gray-600 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-xl text-white/90 mb-8">
            加入 JobQuip 推广者计划，用你的影响力赚取收益
          </p>
          <Link
            href={`/${locale}/promoter/register`}
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            立即注册推广者 →
          </Link>
        </div>
      </div>
    </div>
  );
}
