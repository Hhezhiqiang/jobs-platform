'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AggregatedJob {
  uid: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  tags: string[];
  category: string;
  isInternal: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  datePosted: string;
}

export default function AggregatedJobsClient() {
  const [internal, setInternal] = useState<AggregatedJob[]>([]);
  const [external, setExternal] = useState<AggregatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'web3'>('web3');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [tab]);

  async function fetchJobs() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/aggregated-jobs?category=${tab}&limit=30`);
      const data = await res.json();
      setInternal(data.internal || []);
      setExternal(data.external || []);
    } catch {
      setError('加载失败，请稍后重试');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔭 Web3 全网雷达
        </h1>
        <p className="text-gray-500">
          Agent 持续扫描全网 Web3/区块链岗位，帮你发现散落在各个平台的机会
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'web3', label: '🪙 Web3/区块链' },
          { key: 'all', label: '🌐 全部' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'web3' | 'all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex gap-4 mb-6 text-sm text-gray-500">
            <span>🏠 JobQuip 自营: {internal.length} 个</span>
            <span>🔗 外部聚合: {external.length} 个</span>
          </div>

          {/* External Jobs */}
          {external.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                🔗 外部发现 {external.length} 个岗位
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                以下岗位来自公开数据源，仅供参考。收藏后我们会持续追踪更新。
              </p>
              <div className="space-y-3">
                {external.map(job => (
                  <JobCard key={job.uid} job={job} />
                ))}
              </div>
            </div>
          )}

          {/* Internal Jobs */}
          {internal.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                🏠 JobQuip 自营 {internal.length} 个岗位
              </h2>
              <div className="space-y-3">
                {internal.map(job => (
                  <JobCard key={job.uid} job={job} />
                ))}
              </div>
            </div>
          )}

          {internal.length === 0 && external.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              暂无匹配岗位，试试切换分类
            </div>
          )}
        </>
      )}

      {/* Refresh */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchJobs}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 刷新数据
        </button>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: AggregatedJob }) {
  const isWeb3 = job.category === 'web3' || job.tags?.some(t => 
    ['web3','crypto','blockchain','solidity','defi'].includes(t.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isWeb3 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Web3</span>}
            <span className="text-xs text-gray-400">{job.source}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500">
            {job.company} · {job.location}
            {job.salaryMin && job.salaryMax && (
              <span className="ml-2 text-green-600">
                {job.currency} {job.salaryMin}K-{job.salaryMax}K/月
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {job.description}
          </p>
          {job.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {job.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="ml-4 flex flex-col gap-2">
          {job.isInternal ? (
            <Link
              href={`/zh/jobs/${job.uid.replace('jobquip-', '')}`}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              查看详情
            </Link>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">
              来自 {job.source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}