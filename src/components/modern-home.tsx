"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Search, MapPin, Briefcase, DollarSign, Sparkles, ArrowRight, CheckCircle, Building2, Users, TrendingUp } from "lucide-react";

export function ModernHome() {
  const locale = useLocale();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 现代导航栏 */}
      <nav className="modern-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                J
              </div>
              <span className="text-xl font-bold text-gray-900">JobQuip</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href={`/${locale}/jobs`} className="text-gray-600 hover:text-primary-600 font-medium transition">
                {isEn ? "Jobs" : "职位"}
              </Link>
              <Link href={`/${locale}/companies`} className="text-gray-600 hover:text-primary-600 font-medium transition">
                {isEn ? "Companies" : "公司"}
              </Link>
              <Link href={`/${locale}/blog`} className="text-gray-600 hover:text-primary-600 font-medium transition">
                {isEn ? "Blog" : "博客"}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/${locale}/auth/login`} className="text-gray-700 hover:text-primary-600 font-medium transition">
                {isEn ? "Log In" : "登录"}
              </Link>
              <Link href={`/${locale}/auth/register`} className="btn-gradient">
                {isEn ? "Sign Up Free" : "免费注册"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="hero-section py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm mb-6 border border-white/20 animate-fade-in">
              <Sparkles className="w-4 h-4 text-accent-300" />
              <span>{isEn ? "AI-Powered Job Matching" : "AI 智能匹配"}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
              {isEn ? (
                <>
                  Find Your Dream Job<br />
                  <span className="text-accent-300">in Seconds</span>
                </>
              ) : (
                <>
                  秒级匹配你的<br />
                  <span className="text-accent-300">理想工作</span>
                </>
              )}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {isEn 
                ? "50,000+ positions from top tech companies. Smart matching, real-time updates, and application tracking."
                : "5 万 + 科技行业高薪职位。智能匹配、实时更新、申请追踪，一站式求职平台。"}
            </p>

            {/* 现代搜索框 */}
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-3 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isEn ? "Job title, keywords, or company" : "职位名称、关键词或公司"}
                    className="modern-input w-full pl-12 pr-4 py-3"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select className="modern-input w-full pl-12 pr-4 py-3 appearance-none bg-white cursor-pointer">
                    <option value="">{isEn ? "All Locations" : "全国"}</option>
                    <option value="beijing">{isEn ? "Beijing" : "北京"}</option>
                    <option value="shanghai">{isEn ? "Shanghai" : "上海"}</option>
                    <option value="shenzhen">{isEn ? "Shenzhen" : "深圳"}</option>
                    <option value="hangzhou">{isEn ? "Hangzhou" : "杭州"}</option>
                    <option value="remote">{isEn ? "Remote" : "远程"}</option>
                  </select>
                </div>
                <button className="btn-gradient flex items-center justify-center gap-2 px-8 py-3 md:py-0 md:w-auto">
                  <Search className="w-5 h-5" />
                  <span className="font-semibold">{isEn ? "Search" : "搜索"}</span>
                </button>
              </div>
            </div>

            {/* 热门关键词 */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 text-white/70 text-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span>{isEn ? "Popular:" : "热门搜索："}</span>
              {['前端工程师', '产品经理', 'Java 开发', '数据分析师', 'UI 设计师'].map((kw) => (
                <Link key={kw} href={`/${locale}/jobs?q=${encodeURIComponent(kw)}`} className="hover:text-white transition underline decoration-white/30 hover:decoration-white">
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Briefcase, value: "50,000+", label: isEn ? "Active Jobs" : "在招职位", color: "from-primary-500 to-primary-600" },
              { icon: Building2, value: "2,000+", label: isEn ? "Companies" : "合作企业", color: "from-accent-500 to-accent-600" },
              { icon: Users, value: "100,000+", label: isEn ? "Job Seekers" : "活跃求职者", color: "from-warning-500 to-warning-600" },
              { icon: TrendingUp, value: "95%" , label: isEn ? "Success Rate" : "匹配成功率", color: "from-success-500 to-success-600" },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心优势 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {isEn ? "Why Choose JobQuip?" : "为什么选择 JobQuip？"}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isEn 
                ? "More than just a job board. We're your career partner."
                : "不只是招聘平台，更是你的职业发展伙伴。"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: isEn ? "AI Smart Matching" : "AI 智能匹配",
                desc: isEn 
                  ? "Our AI analyzes your skills and preferences to match you with the perfect positions."
                  : "AI 分析你的技能和偏好，精准匹配最适合的职位。",
                color: "text-primary-600",
                bg: "bg-primary-100",
              },
              {
                icon: CheckCircle,
                title: isEn ? "Real-time Tracking" : "实时追踪",
                desc: isEn
                  ? "Track every application status. Know when employers view your resume."
                  : "追踪每一份申请状态，知道 HR 何时查看了你的简历。",
                color: "text-accent-600",
                bg: "bg-accent-100",
              },
              {
                icon: DollarSign,
                title: isEn ? "Salary Transparency" : "薪资透明",
                desc: isEn
                  ? "Real salary data from verified companies. No more guessing games."
                  : "真实薪资数据，来自认证企业。不再猜来猜去。",
                color: "text-warning-600",
                bg: "bg-warning-100",
              },
            ].map((feature, i) => (
              <div key={i} className="modern-card p-8 group">
                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="modern-card p-12 text-center bg-gradient-to-br from-primary-50 to-accent-50 border-0">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {isEn ? "Ready to Start Your Career Journey?" : "准备好开启职业旅程了吗？"}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {isEn
                ? "Join 100,000+ job seekers who found their dream jobs on JobQuip."
                : "加入 10 万 + 求职者，在 JobQuip 找到理想工作。"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/auth/register`} className="btn-gradient text-lg px-8 py-4">
                {isEn ? "Sign Up Free →" : "免费注册 →"}
              </Link>
              <Link href={`/${locale}/jobs`} className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-primary-300 hover:text-primary-600 transition text-lg">
                {isEn ? "Browse Jobs" : "浏览职位"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 现代页脚 */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  J
                </div>
                <span className="text-xl font-bold">JobQuip</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {isEn
                  ? "Professional job recruitment platform for Web3, internet, and tech industries."
                  : "专业的 Web3、互联网、科技行业求职招聘平台。"}
              </p>
            </div>
            
            {[
              { title: isEn ? "For Job Seekers" : "求职服务", links: [isEn ? "Search Jobs" : "职位搜索", isEn ? "Salary Insights" : "薪资洞察", isEn ? "Career Blog" : "职场博客"] },
              { title: isEn ? "For Employers" : "企业服务", links: [isEn ? "Post Jobs" : "发布职位", isEn ? "Company Profile" : "企业主页", isEn ? "Pricing" : "价格方案"] },
              { title: isEn ? "Company" : "关于", links: [isEn ? "About Us" : "关于我们", isEn ? "Contact" : "联系我们", isEn ? "Privacy" : "隐私政策"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-lg mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link href={`/${locale}`} className="text-gray-400 hover:text-white transition">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 JobQuip. {isEn ? "All rights reserved." : "保留所有权利。"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
