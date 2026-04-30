import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface KeywordCloudProps {
  locale: string;
}

// 关键词到分类的映射
const KEYWORD_CATEGORY_MAP: Record<string, string> = {
  // 面试攻略
  '面试攻略': 'interview',
  '面试技巧': 'interview',
  'Tech 面试攻略': 'interview',
  '高级面试攻略': 'interview',
  '分布式面试攻略': 'interview',
  '市场推广面试攻略': 'interview',
  '销售面试攻略': 'interview',
  '客户经理面试攻略': 'interview',
  '交易系统面试攻略': 'interview',
  'Investment 面试攻略': 'interview',
  'Research 面试攻略': 'interview',
  'Institution 面试攻略': 'interview',
  '压力面试应对': 'interview',
  '群面生存指南': 'interview',
  'HR 面试问题': 'interview',
  '大厂面试流程': 'interview',
  '香港求职面试': 'interview',
  '金融机构面试': 'interview',
  '研究员面试': 'interview',
  '投资岗面试': 'interview',
  '美股面试': 'interview',
  
  // 职业发展
  '职业发展': 'career',
  '职业规划与转型': 'career',
  '职业规划': 'career',
  '升职加薪': 'career',
  '35 岁危机': 'career',
  '转行': 'career',
  
  // 远程工作
  '远程工作': 'remote',
  'remote-work': 'remote',
  '海外求职': 'remote',
  '灵活工作': 'remote',
  
  // 薪资谈判
  '薪资谈判': 'salary',
  '薪资谈判与报告': 'salary',
  '股票期权谈判': 'salary',
  '大厂薪资结构解析': 'salary',
  
  // 技能提升
  '技能提升': 'skills',
  '职场软实力': 'skills',
  '沟通表达': 'skills',
  '情绪管理': 'skills',
  '影响力': 'skills',
  
  // 行业趋势
  '行业趋势': 'trends',
  'industry-trends': 'trends',
  '欧洲技术移民': 'trends',
  '求职趋势': 'trends',
  
  // 简历优化
  '简历优化': 'resume',
  '简历优化技巧': 'resume',
  '简历写作指南': 'resume',
  '应届生简历技巧': 'resume',
  'AI 简历筛选': 'resume',
  
  // 求职避坑
  '求职避坑': 'tips',
  '劳动合同避坑指南': 'tips',
  '试用期生存': 'tips',
  '离职陷阱与维权': 'tips',
  
  // 内推人脉
  '内推与人脉': 'networking',
  '内推实战': 'networking',
  '校友网络求职': 'networking',
  '猎头合作指南': 'networking',
};

// 分类配置
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  'interview': { label: '面试攻略', icon: '🎯', color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  'career': { label: '职业发展', icon: '🚀', color: 'text-purple-600', bgColor: 'bg-purple-50 hover:bg-purple-100' },
  'remote': { label: '远程工作', icon: '🌍', color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
  'salary': { label: '薪资谈判', icon: '💰', color: 'text-amber-600', bgColor: 'bg-amber-50 hover:bg-amber-100' },
  'skills': { label: '技能提升', icon: '💡', color: 'text-cyan-600', bgColor: 'bg-cyan-50 hover:bg-cyan-100' },
  'trends': { label: '行业趋势', icon: '📊', color: 'text-rose-600', bgColor: 'bg-rose-50 hover:bg-rose-100' },
  'resume': { label: '简历优化', icon: '📝', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100' },
  'tips': { label: '求职避坑', icon: '⚠️', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100' },
  'networking': { label: '内推人脉', icon: '🤝', color: 'text-teal-600', bgColor: 'bg-teal-50 hover:bg-teal-100' },
};

export async function KeywordCloud({ locale }: KeywordCloudProps) {
  // 获取所有博客关键词
  const blogs = await prisma.pages.findMany({
    where: { type: 'BLOG', status: 'PUBLISHED' },
    select: { keywords: true },
  });

  // 统计关键词频率
  const keywordCounts: Record<string, number> = {};
  blogs.forEach(blog => {
    (blog.keywords || []).forEach(kw => {
      if (kw && kw.length >= 2 && kw.length < 20 && kw !== 'PRIMARY' && kw !== 'TRAFFIC') {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    });
  });

  // 按频率排序
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50); // 只显示前 50 个

  // 按分类分组
  const groupedKeywords: Record<string, Array<{ keyword: string; count: number }>> = {};
  
  sortedKeywords.forEach(([keyword, count]) => {
    const category = KEYWORD_CATEGORY_MAP[keyword] || 'other';
    if (!groupedKeywords[category]) {
      groupedKeywords[category] = [];
    }
    groupedKeywords[category].push({ keyword, count });
  });

  // 过滤掉没有关键词的分类
  const validCategories = Object.entries(groupedKeywords)
    .filter(([, keywords]) => keywords.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🔥 热门关键词
          </h2>
          <p className="text-gray-600 text-lg">
            探索求职热门话题，找到你需要的内容
          </p>
        </div>

        {/* 分类关键词 */}
        <div className="space-y-8">
          {validCategories.map(([category, keywords]) => {
            const config = CATEGORY_CONFIG[category] || {
              label: category,
              icon: '📌',
              color: 'text-gray-600',
              bgColor: 'bg-gray-50 hover:bg-gray-100',
            };

            return (
              <div key={category}>
                {/* 分类标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{config.icon}</span>
                  <h3 className={`text-xl font-bold ${config.color}`}>
                    {config.label}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {keywords.length} 篇文章
                  </span>
                </div>

                {/* 关键词标签 */}
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 10).map(({ keyword, count }) => (
                    <Link
                      key={keyword}
                      href={`/${locale}/blog?keyword=${encodeURIComponent(keyword)}`}
                      className={`px-4 py-2 ${config.bgColor} ${config.color} rounded-lg text-sm font-medium transition-all hover:shadow-md`}
                    >
                      #{keyword}
                      {count > 1 && (
                        <span className="ml-1 text-xs opacity-60">
                          ({count})
                        </span>
                      )}
                    </Link>
                  ))}
                  {keywords.length > 10 && (
                    <Link
                      href={`/${locale}/blog?category=${category}`}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                    >
                      查看全部 →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all"
          >
            查看全部文章
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
