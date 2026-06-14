/**
 * Web3 + 全网岗位聚合引擎
 * 
 * 核心策略：
 * 1. 从多个公开源拉取 Web3/技术岗位
 * 2. LLM 去重 + 相似度打分
 * 3. 外部岗位标记来源但不直接外链
 * 4. 当用户浏览外部岗位时，推荐 JobQuip 自营库中的相似岗位
 */

// ===================== 数据源 =====================

interface JobSource {
  name: string;
  url: string;
  type: 'api' | 'rss' | 'json' | 'sitemap';
  category: 'web3' | 'tech' | 'general';
  priority: number; // 1-5, 越高越优先
}

export const JOB_SOURCES: JobSource[] = [
  // Web3 专项
  { name: 'RemoteOK', url: 'https://remoteok.com/api', type: 'api', category: 'web3', priority: 5 },
  { name: 'CryptoJobsList', url: 'https://api.cryptojobslist.com/jobs', type: 'api', category: 'web3', priority: 5 },
  { name: 'web3.career', url: 'https://web3.career/_next/data', type: 'api', category: 'web3', priority: 4 },
  { name: 'DeFi Jobs', url: 'https://www.defi.jobs/jobs.rss', type: 'rss', category: 'web3', priority: 4 },
  
  // 技术岗位
  { name: 'GitHub Jobs', url: 'https://jobs.github.com/positions.json', type: 'json', category: 'tech', priority: 3 },
  { name: 'Arbeitsagentur', url: 'https://jobboerse.arbeitsagentur.de/vamJB/stellenangeboteSuche.html', type: 'api', category: 'general', priority: 1 },
  
  // 已有数据源
  { name: 'Adzuna', url: 'https://api.adzuna.com', type: 'api', category: 'general', priority: 5 },
  { name: 'Jooble', url: 'https://jooble.org/api', type: 'api', category: 'general', priority: 4 },
  { name: 'The Muse', url: 'https://www.themuse.com/api', type: 'api', category: 'general', priority: 3 },
];

// ===================== 岗位结构 =====================

export interface AggregatedJob {
  /** 唯一标识：source_name + external_id */
  uid: string;
  /** 来源名称 */
  source: string;
  /** 来源 URL */
  sourceUrl: string;
  /** 岗位标题 */
  title: string;
  /** 公司名 */
  company: string;
  /** 工作地点 */
  location: string;
  /** 描述 */
  description: string;
  /** 薪资范围 */
  salaryMin?: number;
  salaryMax?: number;
  /** 薪资货币 */
  currency?: string;
  /** 发布日期 ISO */
  datePosted: string;
  /** 标签 */
  tags: string[];
  /** 类型：web3, tech, general */
  category: string;
  /** 是否来自 JobQuip 自营 */
  isInternal: boolean;
  /** 与搜索词的相似度 0-100 */
  similarityScore?: number;
}

// ===================== RemoteOK 数据源 =====================

export async function fetchRemoteOk(): Promise<AggregatedJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobQuip/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return [];
    
    const WEB3_KEYWORDS = [
      'web3', 'crypto', 'blockchain', 'solidity', 'defi', 'nft', 'dao',
      'ethereum', 'bitcoin', 'smart contract', 'token', 'metaverse',
      'decentralized', 'dapp', 'layer2', 'zk', 'evm', 'rust',
    ];

    return data.slice(1)
      .map((item: any) => ({
        uid: `remoteok-${item.id || item.slug}`,
        source: 'RemoteOK',
        sourceUrl: item.url || '',
        title: item.position || '',
        company: (item.company || '').trim(),
        location: item.location || 'Remote',
        description: (item.description || '').slice(0, 2000),
        tags: (item.tags || []).slice(0, 10),
        datePosted: new Date(item.date || Date.now()).toISOString(),
        category: 'general',
        isInternal: false,
      }))
      .filter((j: AggregatedJob) => {
        if (!j.title) return false;
        const text = (j.title + ' ' + j.tags.join(' ') + ' ' + j.description).toLowerCase();
        const isWeb3 = WEB3_KEYWORDS.some(kw => text.includes(kw));
        if (isWeb3) j.category = 'web3';
        return isWeb3;  // 只保留 Web3 相关岗位
      });
  } catch {
    return [];
  }
}

// ===================== CryptoJobsList 数据源 =====================

export async function fetchCryptoJobsList(): Promise<AggregatedJob[]> {
  try {
    const res = await fetch('https://api.cryptojobslist.com/jobs', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || data.data || data || [];
    if (!Array.isArray(jobs)) return [];
    
    return jobs.slice(0, 50).map((item: any) => ({
      uid: `cjl-${item.id || item.slug}`,
      source: 'CryptoJobsList',
      sourceUrl: item.url || item.applyUrl || '',
      title: item.title || item.position || '',
      company: item.company?.name || item.company || '',
      location: item.location || item.remote ? 'Remote' : 'On-site',
      description: (item.description || '').slice(0, 2000),
      tags: ['web3', 'crypto', ...(item.tags || [])],
      datePosted: new Date(item.publishedAt || item.createdAt || Date.now()).toISOString(),
      category: 'web3',
      isInternal: false,
    })).filter((j: AggregatedJob) => j.title);
  } catch {
    return [];
  }
}

// ===================== Adzuna 聚合（已有） =====================

export async function fetchAdzunaAggregated(keyword = 'software engineer'): Promise<AggregatedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const countries = ['us', 'gb', 'de', 'ca', 'au', 'sg'];
  const results: AggregatedJob[] = [];

  for (const country of countries) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;
      const res = await fetch(
        `${url}?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.results || []) {
        results.push({
          uid: `adzuna-${country}-${job.id}`,
          source: 'Adzuna',
          sourceUrl: job.redirect_url || '',
          title: job.title,
          company: job.company?.display_name || '',
          location: job.location?.display_name || '',
          description: (job.description || '').slice(0, 2000),
          salaryMin: job.salary_min ? Math.round(job.salary_min / 12 / 1000) : undefined,
          salaryMax: job.salary_max ? Math.round(job.salary_max / 12 / 1000) : undefined,
          currency: country === 'gb' ? 'GBP' : country === 'us' ? 'USD' : 'EUR',
          tags: job.category?.tag ? [job.category.tag] : [],
          datePosted: job.created || new Date().toISOString(),
          category: 'general',
          isInternal: false,
        });
      }
    } catch {}
  }
  return results;
}

// ===================== 批量聚合 =====================

export async function aggregateAllJobs(searchKeyword?: string, category?: string): Promise<AggregatedJob[]> {
  const allJobs: AggregatedJob[] = [];
  
  // RemoteOK（Web3 + 技术岗）
  const remoteOk = await fetchRemoteOk();
  allJobs.push(...remoteOk);

  // Adzuna（已有 API）
  if (searchKeyword) {
    const adzunaJobs = await fetchAdzunaAggregated(searchKeyword);
    allJobs.push(...adzunaJobs);
  }

  // 按分类过滤
  let filtered = deduplicateJobs(allJobs);
  if (category && category !== 'all') {
    filtered = filtered.filter(j => j.category === category);
  }
  
  return filtered;
}

// ===================== 去重引擎 =====================

function deduplicateJobs(jobs: AggregatedJob[]): AggregatedJob[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    // 基于标题 + 公司做 key
    const key = `${job.title.toLowerCase().replace(/[^a-z]/g, '')}-${job.company.toLowerCase().replace(/[^a-z]/g, '')}`.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ===================== 相似度计算 =====================

export function calculateSimilarity(job1: AggregatedJob, job2: AggregatedJob): number {
  const title1 = job1.title.toLowerCase();
  const title2 = job2.title.toLowerCase();
  
  // 简单关键词匹配
  const words1 = new Set(title1.split(/\s+/));
  const words2 = new Set(title2.split(/\s+/));
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return Math.round((intersection / union) * 100);
}

// ===================== 格式化输出 =====================

export function formatJobForDisplay(job: AggregatedJob): string {
  const tags = job.tags.length > 0 ? `🏷️ ${job.tags.slice(0, 5).join(' · ')}` : '';
  const salary = job.salaryMin && job.salaryMax 
    ? `💰 ${job.currency || ''} ${job.salaryMin}K-${job.salaryMax}K/月` 
    : '';
  const source = job.isInternal ? '🏠 JobQuip' : `🔗 ${job.source}`;
  
  return [
    `📌 **${job.title}**`,
    `🏢 ${job.company}`,
    `📍 ${job.location}`,
    salary,
    tags,
    `📅 ${new Date(job.datePosted).toLocaleDateString()}`,
    source,
    `_${job.description.slice(0, 150)}..._`,
  ].filter(Boolean).join('\n');
}