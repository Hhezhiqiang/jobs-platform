import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

// 基于搜索行为的职场关键词趋势
const SEARCH_TRENDS = [
  { keyword: "2026校招", score: 85, tags: ["校招", "应届生"] },
  { keyword: "大厂面经", score: 82, tags: ["面试", "大厂"] },
  { keyword: "Java面试题", score: 78, tags: ["Java", "面试"] },
  { keyword: "产品经理简历", score: 76, tags: ["产品经理", "简历"] },
  { keyword: "数据分析面试", score: 74, tags: ["数据分析", "面试"] },
  { keyword: "前端工程师求职", score: 75, tags: ["前端", "求职"] },
  { keyword: "Python面试", score: 73, tags: ["Python", "面试"] },
  { keyword: "运营面试技巧", score: 71, tags: ["运营", "面试"] },
  { keyword: "UI设计师作品集", score: 70, tags: ["UI设计", "作品集"] },
  { keyword: "算法工程师面经", score: 77, tags: ["算法", "面经"] },
  { keyword: "测试工程师面试", score: 69, tags: ["测试", "面试"] },
  { keyword: "职业规划", score: 72, tags: ["职场", "规划"] },
  { keyword: "薪资谈判技巧", score: 80, tags: ["薪资", "谈判"] },
  { keyword: "转行互联网", score: 75, tags: ["转行", "互联网"] },
  { keyword: "远程工作机会", score: 74, tags: ["远程", "工作"] },
  { keyword: "副业推荐", score: 79, tags: ["副业", "赚钱"] },
  { keyword: "公务员备考", score: 76, tags: ["公务员", "备考"] },
  { keyword: "事业单位招聘", score: 72, tags: ["事业单位", "招聘"] },
  { keyword: "猎头找工作", score: 68, tags: ["猎头", "求职"] },
  { keyword: "职场35岁", score: 83, tags: ["职场", "35岁危机"] },
  { keyword: "AI对就业的影响", score: 86, tags: ["AI", "就业"] },
  { keyword: "新兴职业", score: 71, tags: ["职业", "趋势"] },
  { keyword: "跨境电商运营", score: 70, tags: ["电商", "运营"] },
  { keyword: "新能源行业求职", score: 73, tags: ["新能源", "求职"] },
  { keyword: "医疗器械销售", score: 67, tags: ["医疗", "销售"] },
];

export const baiduTrendsAdapter: KeywordSourceAdapter = {
  name: "baidu_trends",

  async fetch(): Promise<RawKeywordItem[]> {
    const items: RawKeywordItem[] = [];
    
    // 模拟百度搜索趋势数据（实际可接入百度指数API）
    // 按季度调整热度
    const quarter = Math.floor(new Date().getMonth() / 3) + 1;
    const quarterBoost: Record<number, string[]> = {
      1: ["春招", "校招补录", "应届生求职"], // Q1
      2: ["暑期实习", "社招跳槽", "转行互联网"], // Q2
      3: ["秋招", "金九银十", "校招启动"], // Q3
      4: ["年终跳槽", "年后准备", "年终奖"], // Q4
    };

    for (const trend of SEARCH_TRENDS) {
      let score = trend.score;
      
      // 季度加成
      if (quarterBoost[quarter]?.some(term => trend.keyword.includes(term))) {
        score += 10;
      }

      // 随机波动
      score += Math.floor(Math.random() * 10) - 5;
      score = Math.min(100, Math.max(50, score));

      items.push({
        keyword: trend.keyword,
        source: "baidu_trends",
        trendScore: score,
        metadata: { tags: trend.tags, quarter },
      });
    }

    return items;
  },
};
