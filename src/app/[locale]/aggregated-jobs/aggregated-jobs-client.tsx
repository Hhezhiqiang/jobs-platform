'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface AggregatedJob {
  uid: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  tags?: string[];
  category: string;
  isInternal: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  datePosted: string;
}

export default function AggregatedJobsClient() {
  const pathname = usePathname() || '/zh/aggregated-jobs';
  const locale = pathname.startsWith('/en') ? 'en' : 'zh';
  const isEn = locale === 'en';

  const [internal, setInternal] = useState<AggregatedJob[]>([]);
  const [external, setExternal] = useState<AggregatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'web3'>('web3');
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/aggregated-jobs?category=${tab}&limit=30`);
      const data = await res.json();
      setInternal(Array.isArray(data.internal) ? data.internal : []);
      setExternal(Array.isArray(data.external) ? data.external : []);
    } catch {
      setError(isEn ? 'Failed to load, please try again later' : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [isEn, tab]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {isEn ? 'Web3 Job Radar' : 'Web3 全网雷达'}
        </h1>
        <p className="text-gray-500">
          {isEn
            ? 'Agent continuously scans Web3 and blockchain jobs across the web.'
            : 'Agent 持续扫描全网 Web3/区块链岗位，帮你发现分散在各个平台的机会。'}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {[
          { key: 'web3', label: isEn ? 'Web3 / Blockchain' : '🪙 Web3/区块链' },
          { key: 'all', label: isEn ? 'All' : '🌐 全部' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'web3' | 'all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="mb-6 flex gap-4 text-sm text-gray-500">
            <span>
              {isEn ? 'JobQuip internal' : 'JobQuip 自营'}: {internal.length}
            </span>
            <span>
              {isEn ? 'External sources' : '外部聚合'}: {external.length}
            </span>
          </div>

          {external.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                {isEn ? `External jobs (${external.length})` : `外部发现 ${external.length} 个岗位`}
              </h2>
              <p className="mb-4 text-xs text-gray-400">
                {isEn
                  ? 'These jobs come from public sources and are for reference only.'
                  : '以下岗位来自公开数据源，仅供参考。收藏后我们会持续追踪更新。'}
              </p>
              <div className="space-y-3">
                {external.map((job) => (
                  <JobCard key={job.uid} job={job} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {internal.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                {isEn ? `JobQuip jobs (${internal.length})` : `JobQuip 自营 ${internal.length} 个岗位`}
              </h2>
              <div className="space-y-3">
                {internal.map((job) => (
                  <JobCard key={job.uid} job={job} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {internal.length === 0 && external.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              {isEn ? 'No jobs matched this filter.' : '暂无匹配岗位，试试切换分类。'}
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <button onClick={fetchJobs} className="text-sm text-blue-600 hover:text-blue-800">
          {isEn ? 'Refresh' : '🔄 刷新数据'}
        </button>
      </div>
    </div>
  );
}

function JobCard({ job, locale }: { job: AggregatedJob; locale: 'zh' | 'en' }) {
  const tags = Array.isArray(job.tags) ? job.tags : [];
  const isEn = locale === 'en';
  const isWeb3 =
    job.category === 'web3' ||
    tags.some((t) => ['web3', 'crypto', 'blockchain', 'solidity', 'defi'].includes(t.toLowerCase()));
  const salaryText =
    job.salaryMin && job.salaryMax
      ? `${job.currency || ''} ${job.salaryMin}K-${job.salaryMax}K/${isEn ? 'yr' : '年'}`
      : isEn
        ? 'Salary open'
        : '薪资面议';

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {isWeb3 && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Web3</span>}
            <span className="text-xs text-gray-400">{job.source}</span>
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-500">
            {job.company} · {job.location}
            <span className="ml-2 text-green-600">{salaryText}</span>
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400">{job.description}</p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4 flex flex-col gap-2">
          {job.isInternal ? (
            <Link
              href={`/${locale}/jobs/${job.uid.replace('jobquip-', '')}`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white transition hover:bg-blue-700"
            >
              {isEn ? 'View details' : '查看详情'}
            </Link>
          ) : (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-200"
            >
              {isEn ? 'Open source' : `来自 ${job.source}`}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
