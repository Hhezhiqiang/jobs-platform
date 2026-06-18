import type { KeywordSourceAdapter, RawKeywordItem } from "./index";

// ============================================================
// 实时网络热点关键词采集
// 从百度热搜、知乎热榜、微博热搜获取实时热点
// ============================================================

async function fetchBaiduHotTopics(): Promise<RawKeywordItem[]> {
  const items: RawKeywordItem[] = [];
  try {
    // 百度热搜 API
    const r = await fetch("https://top.baidu.com/board?tab=realtime", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await r.text();
    
    // 提取热搜词条
    const matches = html.matchAll(/<!--s-data:(.*?)-->/g);
    for (const m of matches) {
      try {
        const data = JSON.parse(m[1]);
        if (data.cards) {
          for (const card of data.cards) {
            if (card.content) {
              for (const item of card.content) {
                if (item.word && item.word.length > 1 && item.word.length < 30) {
                  items.push({
                    keyword: item.word,
                    source: "baidu_trends",
                    trendScore: 90 - (item.index || 0),
                    sourceUrl: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
                    metadata: { hotScore: item.hotScore, desc: item.desc },
                  });
                }
              }
            }
          }
        }
      } catch { continue; }
    }
    if (items.length > 0) return items;
  } catch (e) { /* fallback to text extraction */ }
  
  // Fallback: simple text extraction
  try {
    const r2 = await fetch("https://top.baidu.com/board?tab=realtime", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    const html2 = await r2.text();
    const titleMatches = html2.matchAll(/<div class="c-single-text-ellipsis">(.+?)<\/div>/g);
    for (const m of titleMatches) {
      const word = m[1].trim();
      if (word.length > 1 && word.length < 30) {
        items.push({ keyword: word, source: "baidu_trends", trendScore: 80 });
      }
    }
  } catch (e) { /* ignore */ }
  
  return items;
}

async function fetchZhihuHotTopics(): Promise<RawKeywordItem[]> {
  const items: RawKeywordItem[] = [];
  try {
    const r = await fetch("https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    if (data.data) {
      for (const item of data.data) {
        const target = item.target || item;
        if (target.title && target.title.length > 1) {
          items.push({
            keyword: target.title,
            source: "zhihu_hot",
            trendScore: 90 - (item.index || 0),
            sourceUrl: target.url || `https://www.zhihu.com/question/${target.id}`,
            metadata: { answerCount: target.answer_count, followerCount: target.follower_count },
          });
        }
      }
    }
  } catch (e) { /* ignore */ }
  return items;
}

async function fetchWeiboHotTopics(): Promise<RawKeywordItem[]> {
  const items: RawKeywordItem[] = [];
  try {
    const r = await fetch("https://weibo.com/ajax/side/hotSearch", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    if (data.data?.realtime) {
      for (const item of data.data.realtime.slice(0, 20)) {
        if (item.word && item.word.length > 1) {
          items.push({
            keyword: item.word,
            source: "weibo",
            trendScore: Math.min(100, 100 - (item.rank || 0) * 2),
            sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
            metadata: { rank: item.rank, category: item.category },
          });
        }
      }
    }
  } catch (e) { /* ignore */ }
  return items;
}

// 职位相关关键词过滤
const JOB_RELATED_PATTERNS = [
  /招聘|求职|工作|面试|简历|薪资|工资|年薪|offer|裁员|跳槽|入职|实习|校招|社招|内推|远程|兼职|自由职业|副业|创业|AI|人工智能|程序员|工程师|设计师|产品经理|运营|数据分析|算法|开发|测试|架构/i,
  /job|hire|career|salary|remote|engineer|developer|manager|intern|freelance|layoff|recruit|startup/i,
];

function isJobRelated(keyword: string): boolean {
  // 如果长度太短或太长，不相关
  if (keyword.length < 3 || keyword.length > 40) return false;
  return JOB_RELATED_PATTERNS.some(p => p.test(keyword));
}

export const realTimeHotTopicsAdapter: KeywordSourceAdapter = {
  name: "realtime_hot_topics",

  async fetch(): Promise<RawKeywordItem[]> {
    const results = await Promise.allSettled([
      fetchBaiduHotTopics(),
      fetchZhihuHotTopics(),
      fetchWeiboHotTopics(),
    ]);

    let allItems: RawKeywordItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        allItems = allItems.concat(r.value);
      }
    }

    // 过滤：只保留职位相关关键词
    const filtered = allItems.filter(item => isJobRelated(item.keyword));
    
    // 去重
    const seen = new Set<string>();
    const unique: RawKeywordItem[] = [];
    for (const item of filtered) {
      const norm = item.keyword.toLowerCase().trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(item);
      }
    }

    return unique.slice(0, 50);
  },
};