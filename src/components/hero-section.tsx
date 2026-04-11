"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase } from "lucide-react";

interface HeroSectionProps {
  jobCount: number;
}

export function HeroSection({ jobCount }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const hotTags = ["前端工程师", "产品经理", "Java开发", "数据分析师", "UI设计师", "运营"];
  const locations = ["北京", "上海", "深圳", "杭州", "广州", "成都"];

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-8 animate-fade-in-up">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          已有 {jobCount.toLocaleString()}+ 职位发布
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          发现你的
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
            理想工作
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          连接顶尖企业与优秀人才，让每一次职业选择都更有价值
        </p>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-3xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <form action="/jobs" className="flex flex-col md:flex-row gap-2">
            {/* Keyword Input */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                name="q"
                placeholder="搜索职位、公司或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="搜索职位关键词"
                className="w-full pl-12 pr-4 py-4 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none text-lg"
              />
            </div>

            {/* Location Select */}
            <div className="relative border-t md:border-t-0 md:border-l border-gray-200">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin className="w-5 h-5" />
              </div>
              <select
                name="city"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="选择城市"
                className="w-full md:w-40 pl-12 pr-8 py-4 text-gray-800 bg-transparent focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">全国</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              搜索
            </button>
          </form>
        </div>

        {/* Hot Tags */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <p className="text-blue-200 text-sm mb-3">热门搜索</p>
          <div className="flex flex-wrap justify-center gap-2">
            {hotTags.map((tag) => (
              <Link
                key={tag}
                href={`/jobs?q=${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all backdrop-blur-sm"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
