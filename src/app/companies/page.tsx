"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
import { Building2, MapPin, Users, Briefcase, Search, X, Building } from "lucide-react";

// 模拟公司数据（实际应该从API获取）
const mockCompanies = [
  {
    id: "1",
    name: "字节跳动",
    slug: "bytedance",
    industry: "互联网",
    description: "字节跳动成立于2012年，是一家全球化的科技公司，旗下拥有抖音、今日头条等产品。",
    logo: null,
    size: "10,000+ 人",
    location: "北京",
    jobs: 156,
  },
  {
    id: "2",
    name: "阿里巴巴",
    slug: "alibaba",
    industry: "电商/云计算",
    description: "阿里巴巴集团是全球领先的电子商务公司，业务涵盖零售、云计算、数字媒体等。",
    logo: null,
    size: "10,000+ 人",
    location: "杭州",
    jobs: 234,
  },
  {
    id: "3",
    name: "腾讯",
    slug: "tencent",
    industry: "互联网",
    description: "腾讯是一家以互联网为基础的科技文化公司，产品包括微信、QQ、腾讯游戏等。",
    logo: null,
    size: "10,000+ 人",
    location: "深圳",
    jobs: 189,
  },
  {
    id: "4",
    name: "美团",
    slug: "meituan",
    industry: "本地生活",
    description: "美团是一家科技零售公司，以'帮大家吃得更好，生活更好'为使命。",
    logo: null,
    size: "10,000+ 人",
    location: "北京",
    jobs: 98,
  },
  {
    id: "5",
    name: "京东",
    slug: "jd",
    industry: "电商",
    description: "京东是中国领先的技术驱动型电商和零售基础设施服务商。",
    logo: null,
    size: "10,000+ 人",
    location: "北京",
    jobs: 145,
  },
  {
    id: "6",
    name: "小米",
    slug: "xiaomi",
    industry: "智能硬件",
    description: "小米是一家以手机、智能硬件和IoT平台为核心的互联网公司。",
    logo: null,
    size: "10,000+ 人",
    location: "北京",
    jobs: 76,
  },
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies] = useState(mockCompanies);

  // 搜索过滤功能
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query) ||
        company.location.toLowerCase().includes(query) ||
        company.description.toLowerCase().includes(query)
    );
  }, [searchQuery, companies]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="text-blue-100/80">
              <Breadcrumb items={[{ label: "公司列表" }]} />
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">发现优秀企业</h1>
            <p className="text-blue-100 text-lg">
              浏览 {filteredCompanies.length} 家合作企业，找到适合你的职业发展平台
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="搜索公司名称、行业或城市..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="搜索公司"
                  className="w-full pl-12 pr-12 py-4 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold">{filteredCompanies.length}</span> 家公司
              匹配 "<span className="font-semibold">{searchQuery}</span>"
            </p>
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              清除搜索
            </button>
          </div>
        )}

        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Header Background */}
                <div className="h-24 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                  <div className="absolute -bottom-8 left-6">
                    {company.logo ? (
                      <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden ring-4 ring-white">
                        <Image
                          src={company.logo}
                          alt={`${company.name} 公司Logo`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl shadow-lg bg-white flex items-center justify-center text-2xl font-bold text-blue-600 ring-4 ring-white">
                        {company.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-10 pb-6 px-6">
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </h2>

                  {company.industry && (
                    <p className="text-gray-500 mt-1">{company.industry}</p>
                  )}

                  {company.description && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                    {company.size && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {company.size}
                      </span>
                    )}
                    {company.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Briefcase className="w-4 h-4" />
                      {company.jobs} 个职位
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">未找到相关公司</h3>
            <p className="text-gray-500 mb-6">尝试使用其他关键词搜索</p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              查看全部公司
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
