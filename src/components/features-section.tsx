"use client";

import { usePathname } from "next/navigation";

const featuresZh = [
  {
    icon: "🎯",
    title: "精准匹配",
    description: "AI 智能推荐，根据你的技能和偏好，精准匹配最适合的职位",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: "⚡",
    title: "极速响应",
    description: "企业平均 24 小时内回复，让求职不再漫长等待",
    color: "from-green-500 to-green-600",
  },
  {
    icon: "🛡️",
    title: "安全可靠",
    description: "严格的企业认证机制，保护你的隐私和权益",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: "💡",
    title: "职场干货",
    description: "海量求职攻略和行业资讯，助你职场进阶",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: "📊",
    title: "薪资透明",
    description: "真实薪资数据参考，谈薪不再盲目",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: "🌟",
    title: "名企直招",
    description: "与一线大厂直接对接，跳过中间环节",
    color: "from-indigo-500 to-indigo-600",
  },
];

const featuresEn = [
  {
    icon: "🎯",
    title: "Smart Matching",
    description: "AI-powered recommendations that match your skills and preferences to the best positions",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: "⚡",
    title: "Fast Response",
    description: "Companies respond within 24 hours on average — no more endless waiting",
    color: "from-green-500 to-green-600",
  },
  {
    icon: "🛡️",
    title: "Verified & Safe",
    description: "Strict company verification to protect your privacy and interests",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: "💡",
    title: "Career Insights",
    description: "Job-seeking guides and industry news to advance your career",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: "📊",
    title: "Salary Transparency",
    description: "Real salary data to negotiate with confidence",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: "🌟",
    title: "Direct Hiring",
    description: "Connect directly with top companies, skip the middleman",
    color: "from-indigo-500 to-indigo-600",
  },
];

export function FeaturesSection() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";
  const features = isEn ? featuresEn : featuresZh;
  const heading = isEn ? "Why Choose Us" : "为什么选择我们";
  const subtitle = isEn
    ? "More than job search — it's about finding your career opportunity"
    : "不只是找工作，更是找到属于你的职业机会";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {heading}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-2xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
