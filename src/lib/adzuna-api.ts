import { prisma } from './prisma';
import { parseJobDescriptionsBatch, needsAIParsing } from './parse-job-description';
import { getRegionTags } from './global-job-tags';

// ─── 类型定义 ────────────────────────────────────────────────

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  created: string;
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  count: number;
  results: AdzunaJob[];
  __CLASS__: string;
}

export interface SyncProgress {
  phase: 'fetching' | 'parsing' | 'inserting' | 'done' | 'error';
  fetched: number;       // 已从 API 获取的总数
  parsed: number;        // 已 AI 解析的总数
  inserted: number;      // 已插入/跳过的总数
  skipped: number;       // 因重复跳过的总数
  failed: number;        // 失败的总数
  aiCalls: number;       // 实际 AI 调用次数
  totalPages: number;    // 已抓取页数
  message: string;
}

export type ProgressCallback = (progress: SyncProgress) => void;

// ─── 信号量（并发控制） ──────────────────────────────────────

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

// ─── 配置 ────────────────────────────────────────────────────

const SYNC_CONFIG = {
  // Adzuna API 限流：每秒最多 2 次请求（安全值）
  apiMaxConcurrent: 3,
  apiDelayMs: 500, // 请求间最小间隔

  // AI 解析并发度
  aiConcurrency: 5,

  // 默认抓取页数
  defaultPages: 3,
  maxPages: 5,

  // 批量插入大小
  batchSize: 100,

  // 重试
  maxRetries: 3,
  retryBaseDelay: 1000,

  // 扩展关键词和地点
  keywords: [
    'software engineer',
    'software developer',
    'full stack developer',
    'fullstack developer',
    'frontend developer',
    'front end developer',
    'backend developer',
    'devops engineer',
    'data scientist',
    'data engineer',
    'machine learning engineer',
    'ml engineer',
    'product manager',
    'technical lead',
    'engineering manager',
    'cloud engineer',
    'site reliability engineer',
    'security engineer',
    'mobile developer',
    'ios developer',
    'android developer',
  ],

  locations: [
    'London',
    'Manchester',
    'Birmingham',
    'Bristol',
    'Leeds',
    'Edinburgh',
    'Glasgow',
    'Liverpool',
    'Cambridge',
    'Oxford',
    'Reading',
    'Newcastle',
    'Sheffield',
    'Nottingham',
    'Southampton',
  ],

  countries: ['gb'],
};

// ─── 工具函数 ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCity(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName;
}

function retry<T>(fn: () => Promise<T>, maxRetries: number = SYNC_CONFIG.maxRetries): Promise<T> {
  return (async function attempt(n: number): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (n >= maxRetries) throw err;
      const delay = SYNC_CONFIG.retryBaseDelay * Math.pow(2, n);
      console.warn(`[adzuna] 重试 ${n + 1}/${maxRetries} 在 ${delay}ms 后:`, (err as Error).message);
      await sleep(delay);
      return attempt(n + 1);
    }
  })(0);
}

function deduplicateJobs(jobs: AdzunaJob[]): AdzunaJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });
}

// ─── Adzuna API 调用（带限流和重试） ─────────────────────────

async function fetchAdzunaPage(
  keyword: string,
  location: string,
  page: number,
  country: string,
  semaphore: Semaphore,
): Promise<AdzunaResponse | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('[adzuna] API credentials not configured');
    return null;
  }

  await semaphore.acquire();

  try {
    const result = await retry(async () => {
      const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search`;
      const url = new URL(`${baseUrl}/${page}`);
      url.searchParams.set('app_id', appId);
      url.searchParams.set('app_key', appKey);
      url.searchParams.set('results_per_page', '50');
      if (keyword) url.searchParams.set('what', keyword);
      if (location) url.searchParams.set('where', location);

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        const body = await response.text();
        // 404 或无结果不算错误
        if (response.status === 404) return { count: 0, results: [], __CLASS__: 'AdzunaJob' } as AdzunaResponse;
        throw new Error(`Adzuna API error ${response.status}: ${body}`);
      }

      return (await response.json()) as AdzunaResponse;
    });

    await sleep(SYNC_CONFIG.apiDelayMs);
    return result;
  } finally {
    semaphore.release();
  }
}

// ─── 多页抓取 ────────────────────────────────────────────────

async function fetchMultiPage(
  keyword: string,
  location: string,
  country: string,
  maxPages: number,
  semaphore: Semaphore,
  onProgress?: ProgressCallback,
): Promise<AdzunaJob[]> {
  const allJobs: AdzunaJob[] = [];
  let totalPages = 0;

  for (let page = 1; page <= maxPages; page++) {
    const data = await fetchAdzunaPage(keyword, location, page, country, semaphore);
    if (!data || data.results.length === 0) break;

    totalPages = page;
    allJobs.push(...data.results);

    onProgress?.({
      phase: 'fetching',
      fetched: allJobs.length,
      parsed: 0,
      inserted: 0,
      skipped: 0,
      failed: 0,
      aiCalls: 0,
      totalPages,
      message: `已抓取 ${allJobs.length} 个职位 (第 ${page} 页)`,
    });

    // 如果返回结果少于 50，说明已到最后一页
    if (data.results.length < 50) break;

    // 根据 Adzuna count 判断是否继续
    if (allJobs.length >= data.count * 0.9) break;
  }

  return deduplicateJobs(allJobs);
}

// ─── 职位数据转换 ────────────────────────────────────────────

function transformJob(
  job: AdzunaJob,
  location: string,
  country: string,
  companyId: string,
  authorId: string,
) {
  const fullLocation = job.location?.display_name || location || 'Remote';
  const city = extractCity(fullLocation);
  const globalTags = getRegionTags(country, fullLocation);

  if (job.category?.tag) {
    globalTags.push(job.category.tag);
  }

  // 从描述中提取直接申请 URL
  let directApplyUrl = job.redirect_url;
  const urlMatch = job.description.match(/(https?:\/\/[^\s<>"']+)/i);
  if (urlMatch && urlMatch[1] && !urlMatch[1].includes('adzuna.com')) {
    directApplyUrl = urlMatch[1];
  }

  // 解析创建日期
  let datePosted = new Date();
  try {
    datePosted = new Date(job.created);
    if (isNaN(datePosted.getTime())) datePosted = new Date();
  } catch {
    // ignore
  }

  return {
    slug: `adzuna-${job.id}`,
    title: job.title,
    description: '', // placeholder，后续用 AI 结果或原文填充
    requirements: '',
    benefits: '',
    location: fullLocation,
    city,
    country: country.toUpperCase(),
    salaryMin: job.salary_min || null,
    salaryMax: job.salary_max || null,
    salaryCurrency: 'GBP',
    employmentType:
      job.contract_type === 'part_time'
        ? 'PART_TIME'
        : job.contract_type === 'contract'
          ? 'CONTRACT'
          : job.contract_type === 'internship'
            ? 'INTERNSHIP'
            : job.contract_type === 'freelance'
              ? 'FREELANCE'
              : 'FULL_TIME',
    applyUrl: directApplyUrl,
    status: 'ACTIVE' as const,
    companyId,
    authorId,
    keywords: globalTags,
    datePosted,
    // 这些字段在 Prisma schema 中有默认值，不需要显式设置
    // isRemote, isHybrid, isFeatured, viewCount 都有默认值
  };
}

// ─── 批量插入 ────────────────────────────────────────────────

async function batchInsertJobs(
  jobData: Array<Record<string, unknown>>,
  onProgress?: ProgressCallback,
): Promise<{ inserted: number; skipped: number; failed: number }> {
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < jobData.length; i += SYNC_CONFIG.batchSize) {
    const batch = jobData.slice(i, i + SYNC_CONFIG.batchSize);

    try {
      const result = await prisma.jobs.createMany({
        data: batch as any,
        skipDuplicates: true,
      });

      inserted += result.count;
      skipped += batch.length - result.count;

      onProgress?.({
        phase: 'inserting',
        fetched: 0,
        parsed: 0,
        inserted: inserted + skipped,
        skipped,
        failed,
        aiCalls: 0,
        totalPages: 0,
        message: `已写入 ${inserted + skipped} 条 (新增 ${inserted}, 跳过 ${skipped})`,
      });
    } catch (error: unknown) {
      console.error(`[adzuna] 批量插入失败 (batch ${i}):`, (error as Error).message);
      failed += batch.length;
    }
  }

  return { inserted, skipped, failed };
}

// ─── 主函数：优化的批量抓取 ──────────────────────────────────

export interface FetchAdzunaBulkOptions {
  keywords?: string[];
  locations?: string[];
  countries?: string[];
  pages?: number;
  onProgress?: ProgressCallback;
}

export async function fetchAdzunaBulkJobs(options?: FetchAdzunaBulkOptions): Promise<{
  total: number;
  fetched: number;
  inserted: number;
  skipped: number;
  failed: number;
  aiCalls: number;
}> {
  const keywords = options?.keywords ?? SYNC_CONFIG.keywords;
  const locations = options?.locations ?? SYNC_CONFIG.locations;
  const countries = options?.countries ?? SYNC_CONFIG.countries;
  const maxPages = Math.min(options?.pages ?? SYNC_CONFIG.defaultPages, SYNC_CONFIG.maxPages);
  const onProgress = options?.onProgress;

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const companyId = process.env.ADZUNA_COMPANY_ID || '';
  const authorId = process.env.ADZUNA_AUTHOR_ID || '';

  if (!appId || !appKey) {
    console.error('[adzuna] API credentials not configured');
    return { total: 0, fetched: 0, inserted: 0, skipped: 0, failed: 0, aiCalls: 0 };
  }

  if (!companyId || !authorId) {
    console.error('[adzuna] 未配置公司/作者 ID');
    return { total: 0, fetched: 0, inserted: 0, skipped: 0, failed: 0, aiCalls: 0 };
  }

  const apiSemaphore = new Semaphore(SYNC_CONFIG.apiMaxConcurrent);
  const allJobs: AdzunaJob[] = [];
  let totalApiCalls = 0;

  // ── Phase 1: 并发抓取所有关键词 × 地点 ──
  onProgress?.({
    phase: 'fetching',
    fetched: 0,
    parsed: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    aiCalls: 0,
    totalPages: 0,
    message: `开始抓取: ${keywords.length} 关键词 × ${locations.length} 地点 × ${maxPages} 页`,
  });

  const fetchPromises: Promise<void>[] = [];

  for (const country of countries) {
    for (const keyword of keywords) {
      for (const loc of locations) {
        const p = (async () => {
          try {
            const jobs = await fetchMultiPage(keyword, loc, country, maxPages, apiSemaphore, onProgress);
            allJobs.push(...jobs);
            totalApiCalls++;
          } catch (error: unknown) {
            console.error(`[adzuna] 抓取失败 ${keyword} @ ${loc}:`, (error as Error).message);
          }
        })();
        fetchPromises.push(p);

        // 避免同时发起太多请求，控制 burst
        if (fetchPromises.length % 10 === 0) {
          await sleep(SYNC_CONFIG.apiDelayMs * 2);
        }
      }
    }
  }

  await Promise.allSettled(fetchPromises);

  const fetchedJobs = deduplicateJobs(allJobs);
  const fetchedCount = fetchedJobs.length;

  onProgress?.({
    phase: 'fetching',
    fetched: fetchedCount,
    parsed: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    aiCalls: totalApiCalls,
    totalPages: maxPages,
    message: `抓取完成: ${fetchedCount} 个唯一职位 (${totalApiCalls} 次 API 调用)`,
  });

  if (fetchedCount === 0) {
    console.log('[adzuna] 未获取到任何职位');
    return { total: 0, fetched: 0, inserted: 0, skipped: 0, failed: 0, aiCalls: totalApiCalls };
  }

  // ── Phase 2: 转换数据，筛选需要 AI 解析的职位 ──
  const transformedJobs = fetchedJobs.map((job) => ({
    job,
    data: transformJob(job, job.location?.display_name || '', countries[0] || 'gb', companyId, authorId),
  }));

  // 筛选需要 AI 解析的职位
  const needAI = transformedJobs.filter((t) => needsAIParsing(t.job.description));
  const noNeedAI = transformedJobs.filter((t) => !needsAIParsing(t.job.description));

  // 不需要 AI 的职位直接使用原文
  for (const t of noNeedAI) {
    t.data.description = t.job.description.substring(0, 500);
    t.data.requirements = '';
    t.data.benefits = '';
  }

  // ── Phase 3: 批量 AI 解析 ──
  let aiCallCount = 0;

  if (needAI.length > 0) {
    onProgress?.({
      phase: 'parsing',
      fetched: fetchedCount,
      parsed: 0,
      inserted: 0,
      skipped: 0,
      failed: 0,
      aiCalls: 0,
      totalPages: 0,
      message: `开始 AI 解析: ${needAI.length} 个职位`,
    });

    const aiInputs = needAI.map((t) => ({
      id: t.job.id,
      description: t.job.description,
    }));

    const parsedMap = await parseJobDescriptionsBatch(aiInputs, SYNC_CONFIG.aiConcurrency);

    // 估算 AI 调用次数（parseJobDescriptionsBatch 内部会去重）
    aiCallCount = parsedMap.size - noNeedAI.length;

    for (const t of needAI) {
      const parsed = parsedMap.get(t.job.id);
      if (parsed) {
        t.data.description = parsed.description;
        t.data.requirements = parsed.requirements;
        t.data.benefits = parsed.benefits;
      } else {
        t.data.description = t.job.description.substring(0, 500);
      }
    }

    onProgress?.({
      phase: 'parsing',
      fetched: fetchedCount,
      parsed: needAI.length,
      inserted: 0,
      skipped: 0,
      failed: 0,
      aiCalls: aiCallCount,
      totalPages: 0,
      message: `AI 解析完成: ${needAI.length} 个职位 (~${aiCallCount} 次调用)`,
    });
  }

  // ── Phase 4: 批量插入 ──
  onProgress?.({
    phase: 'inserting',
    fetched: fetchedCount,
    parsed: needAI.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
    aiCalls: aiCallCount,
    totalPages: 0,
    message: `开始批量写入 ${transformedJobs.length} 条数据`,
  });

  const jobDataList = transformedJobs.map((t) => t.data);
  const { inserted, skipped, failed } = await batchInsertJobs(jobDataList, onProgress);

  const totalNew = inserted + skipped;

  // ── Done ──
  onProgress?.({
    phase: 'done',
    fetched: fetchedCount,
    parsed: needAI.length,
    inserted: totalNew,
    skipped,
    failed,
    aiCalls: aiCallCount,
    totalPages: maxPages,
    message: `同步完成: 新增 ${inserted} 条, 跳过 ${skipped} 条, 失败 ${failed} 条`,
  });

  console.log(
    `[adzuna] 同步完成: 抓取 ${fetchedCount} 个, 新增 ${inserted} 个, 跳过 ${skipped} 个, 失败 ${failed} 个, AI 调用 ~${aiCallCount} 次`,
  );

  return {
    total: totalNew,
    fetched: fetchedCount,
    inserted,
    skipped,
    failed,
    aiCalls: aiCallCount,
  };
}

// ─── 保持向后兼容的单次抓取 ──────────────────────────────────

export async function fetchAdzunaJobs(
  keyword?: string,
  location?: string,
  page: number = 1,
  country: string = 'gb',
): Promise<number> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const companyId = process.env.ADZUNA_COMPANY_ID || '';
  const authorId = process.env.ADZUNA_AUTHOR_ID || '';

  if (!appId || !appKey || !companyId || !authorId) {
    console.error('[adzuna] 配置不完整');
    return 0;
  }

  const semaphore = new Semaphore(1);
  const data = await fetchAdzunaPage(keyword || '', location || '', page, country, semaphore);

  if (!data || data.results.length === 0) return 0;

  // 转换并批量插入
  const jobDataList = data.results.map((job) =>
    transformJob(job, location || '', country, companyId, authorId),
  );

  // 对需要 AI 解析的处理
  const needAI = jobDataList.filter((_, i) => needsAIParsing(data.results[i].description));

  if (needAI.length > 0) {
    const aiInputs = data.results
      .filter((job) => needsAIParsing(job.description))
      .map((job) => ({ id: job.id, description: job.description }));

    const parsedMap = await parseJobDescriptionsBatch(aiInputs, 5);

    for (let i = 0; i < data.results.length; i++) {
      const job = data.results[i];
      if (needsAIParsing(job.description)) {
        const parsed = parsedMap.get(job.id);
        if (parsed) {
          jobDataList[i].description = parsed.description;
          jobDataList[i].requirements = parsed.requirements;
          jobDataList[i].benefits = parsed.benefits;
        } else {
          jobDataList[i].description = job.description.substring(0, 500);
        }
      } else {
        jobDataList[i].description = job.description.substring(0, 500);
      }
    }
  } else {
    for (let i = 0; i < data.results.length; i++) {
      jobDataList[i].description = data.results[i].description.substring(0, 500);
    }
  }

  const { inserted, skipped } = await batchInsertJobs(jobDataList);
  console.log(`[adzuna] 单页抓取: 新增 ${inserted}, 跳过 ${skipped}`);
  return inserted + skipped;
}
