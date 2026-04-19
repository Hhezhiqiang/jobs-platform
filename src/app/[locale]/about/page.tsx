import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { Metadata } from "next";
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  Award, 
  Heart,
  MapPin,
  Mail,
  Phone,
  MessageCircle
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
  const zh = `${siteUrl}/${locale}`;

  return {
    title: "关于我们 - JobQuip招聘平台",
    description: "了解JobQuip招聘平台的使命、团队和价值观。我们致力于为求职者和招聘企业提供最优质的连接服务，打造专业的求职招聘体验。",
    keywords: ["关于JobQuip", "招聘平台介绍", "求职网站", "JobQuip团队", "招聘服务"],
    openGraph: {
      title: "关于我们 - JobQuip招聘平台",
      description: "了解JobQuip招聘平台的使命、团队和价值观。我们致力于为求职者和招聘企业提供最优质的连接服务。",
      url: `${zh}/about`,
      siteName: "JobQuip招聘平台",
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      images: [`${siteUrl}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: "关于我们 - JobQuip招聘平台",
      description: "了解JobQuip招聘平台的使命、团队和价值观。",
      images: [`${siteUrl}/logo.png`],
    },
    alternates: {
      canonical: `${zh}/about`,
      languages: {
        "zh-CN": `${siteUrl}/zh/about`,
        "en": `${siteUrl}/en/about`,
        "x-default": `${siteUrl}/zh/about`,
      },
    },
  };
}

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: "精准匹配",
      description: "智能算法为您推荐最合适的职位和人才",
      color: "blue",
    },
    {
      icon: Zap,
      title: "高效快捷",
      description: "简化求职流程，让找工作变得更简单",
      color: "yellow",
    },
    {
      icon: Shield,
      title: "安全可靠",
      description: "严格审核企业信息，保护用户隐私",
      color: "green",
    },
    {
      icon: Award,
      title: "专业服务",
      description: "提供简历优化、面试指导等专业服务",
      color: "purple",
    },
  ];

  const stats = [
    { number: "10,000+", label: "优质职位" },
    { number: "500+", label: "合作企业" },
    { number: "50,000+", label: "注册用户" },
    { number: "98%", label: "满意度" },
  ];

  const team = [
    {
      name: "张经理",
      role: "创始人 & CEO",
      description: "10年人力资源行业经验，曾任多家知名企业HR总监",
    },
    {
      name: "李技术",
      role: "技术总监",
      description: "全栈开发专家，专注于打造极致用户体验",
    },
    {
      name: "王运营",
      role: "运营总监",
      description: "深耕互联网行业运营，擅长用户增长与留存",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-6">
            <Breadcrumb items={[{ label: "关于我们" }]} />
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              让每一次职业选择都更有价值
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              JobQuip致力于连接优秀人才与优质企业，
              通过技术创新和专业服务，打造极致的求职招聘体验。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/jobs"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
              >
                浏览职位
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                联系我们
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600">{stat.number}</p>
                <p className="text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">我们的使命</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                在这个快速变化的时代，人才是企业最宝贵的资产。
                我们希望通过技术创新，消除求职过程中的信息不对称，
                让每一位求职者都能找到真正适合自己的职业机会。
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                同时，我们也致力于帮助企业高效地找到合适的人才，
                降低招聘成本，提升招聘效率，实现人才与企业的双赢。
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">以用户为中心</h3>
                    <p className="text-gray-600">始终把用户体验放在第一位</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">开放透明</h3>
                    <p className="text-gray-600">真实信息，诚信服务</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">持续创新</h3>
                    <p className="text-gray-600">不断探索更好的解决方案</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我们提供全方位的求职招聘服务，让您的职业发展之路更加顺畅
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: "bg-blue-50 text-blue-600",
                yellow: "bg-yellow-50 text-yellow-600",
                green: "bg-green-50 text-green-600",
                purple: "bg-purple-50 text-purple-600",
              };
              
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">核心团队</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              一支充满激情的团队，致力于为求职者和企业创造价值
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">联系我们</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            有任何问题或建议？我们随时为您服务
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl">
            <MessageCircle className="w-5 h-5" />
            <span>请通过页面右下角的在线客服与我们联系</span>
          </div>
        </div>
      </section>
    </div>
  );
}
