import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

// 预定义的高价值招聘关键词池
const HOT_TOPICS = [
  // 技术类
  "AI工程师招聘", "大模型算法", "Java开发", "前端工程师", "Golang后端",
  "产品经理", "数据分析", "测试开发", "运维工程师", "嵌入式开发",
  // 远程/海外类
  "远程工作", "Web3招聘", "新加坡工作", "日本IT", "澳洲打工度假",
  // 职场/求职类
  "薪资查询", "面试技巧", "简历优化", "跳槽涨薪", "35岁危机",
  "大厂裁员", "外企招聘", "国企招聘", "公务员", "事业单位",
  // 行业特定
  "跨境电商运营", "TikTok运营", "游戏策划", "短视频剪辑", "直播运营"
];

export const localHotTopicsAdapter: KeywordSourceAdapter = {
  name: "local_hot_topics",

  async fetch(): Promise<RawKeywordItem[]> {
    // 模拟实时热度，每次随机波动
    return HOT_TOPICS.map((keyword) => ({
      keyword,
      source: "local_hot_topics",
      trendScore: Math.floor(Math.random() * 40) + 60, // 60-100
      metadata: { category: "trending", region: "CN" },
    }));
  },
};
