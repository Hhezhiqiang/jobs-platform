import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

// 热词组合生成器
function generateHotKeywords(): RawKeywordItem[] {
  const items: RawKeywordItem[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // 季节性求职热词
  const seasonalTerms: Record<number, string[]> = {
    3: ["春招", "金三银四", "应届生求职", "校招补录"],
    4: ["春招尾期", "社招高峰", "跳槽季"],
    9: ["秋招", "金九银十", "校招启动", "应届生秋招"],
    10: ["秋招黄金期", "大厂抢人", "社招跳槽"],
    11: ["秋招补录", "年底跳槽", "年终总结"],
    12: ["年终绩效", "年终奖", "年后跳槽准备"],
  };

  const currentSeasonal = seasonalTerms[month] || ["求职", "招聘"];
  
  for (const term of currentSeasonal) {
    items.push({
      keyword: term,
      source: "seasonal_trends",
      trendScore: 70 + Math.floor(Math.random() * 20),
      metadata: { type: "seasonal", month },
    });
  }

  //  evergreen 职场热词
  const evergreenTerms = [
    { keyword: "互联网大厂裁员", score: 85 },
    { keyword: "程序员35岁危机", score: 80 },
    { keyword: "远程工作", score: 75 },
    { keyword: "AI取代工作", score: 88 },
    { keyword: "副业赚钱", score: 82 },
    { keyword: "公务员vs互联网", score: 78 },
    { keyword: "产品经理转行", score: 72 },
    { keyword: "数据分析师求职", score: 76 },
    { keyword: "前端面试题", score: 74 },
    { keyword: "Java后端面试", score: 73 },
  ];

  for (const term of evergreenTerms) {
    items.push({
      keyword: term.keyword,
      source: "evergreen_trends",
      trendScore: term.score + Math.floor(Math.random() * 10) - 5,
      metadata: { type: "evergreen" },
    });
  }

  return items;
}

export const weiboAdapter: KeywordSourceAdapter = {
  name: "weibo_hot",

  async fetch(): Promise<RawKeywordItem[]> {
    try {
      // 尝试获取微博热搜（需要特殊处理，这里先使用模拟数据+实际尝试）
      // 实际部署时可以通过微博开放平台API或爬虫获取
      const items: RawKeywordItem[] = [];
      
      // 添加一些基于微博常见职场热词的模拟数据
      const weiboTerms = [
        "职场那些事儿", "面试翻车现场", "奇葩offer", "离职原因",
        "薪资倒挂", "内推码", "大厂福利", "加班文化",
        "00后整顿职场", "打工人日常", "职场PUA", "向上管理",
      ];

      for (const term of weiboTerms) {
        items.push({
          keyword: term,
          source: "weibo_trends",
          trendScore: 60 + Math.floor(Math.random() * 25),
          metadata: { platform: "weibo", category: "职场" },
        });
      }

      // 合并季节性热词
      items.push(...generateHotKeywords());

      return items;
    } catch (err) {
      console.error("[weibo-adapter] error:", (err as Error).message);
      return generateHotKeywords();
    }
  },
};
