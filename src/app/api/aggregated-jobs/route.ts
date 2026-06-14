/**
 * API 路由：GET /api/aggregated-jobs
 * 返回聚合后的外部 + 内部岗位
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteOk, fetchCryptoJobsList, fetchAdzunaAggregated, aggregateAllJobs } from '@/lib/job-agg-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined; // web3, tech, general
    const source = searchParams.get('source') || undefined;
    const onlyExternal = searchParams.get('onlyExternal') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // 1. 从自营库获取岗位
    let internalJobs: any[] = [];
    if (!onlyExternal) {
      const where: any = { status: 'ACTIVE' };
      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ];
      }
      internalJobs = await prisma.jobs.findMany({
        where,
        select: {
          id: true, slug: true, title: true, description: true,
          location: true, city: true, country: true,
          salaryMin: true, salaryMax: true, salaryCurrency: true,
          employmentType: true, experience: true,
          datePosted: true, isRemote: true,
          companies: { select: { id: true, name: true, slug: true, logo: true } },
        },
        take: limit,
        orderBy: { datePosted: 'desc' },
      });

      // 标记为内部岗位
      internalJobs = internalJobs.map(j => ({
        ...j,
        source: 'JobQuip',
        sourceUrl: `/zh/jobs/${j.slug}`,
        isInternal: true,
        category: 'general',
      }));
    }

    // 2. 从外部源聚合
    let externalJobs: any[] = [];
    if (source !== 'internal') {
      const aggregated = await aggregateAllJobs(keyword);
      externalJobs = aggregated
        .filter(j => !category || j.category === category)
        .slice(0, limit);
    }

    return NextResponse.json({
      internal: internalJobs,
      external: externalJobs,
      total: {
        internal: internalJobs.length,
        external: externalJobs.length,
      },
      sources: [
        { name: 'RemoteOK', icon: '🌐', category: 'web3', status: 'active' },
        { name: 'CryptoJobsList', icon: '🔗', category: 'web3', status: 'limited' },
        { name: 'Adzuna', icon: '📡', category: 'general', status: 'active' },
        { name: 'JobQuip', icon: '🏠', category: 'all', status: 'active' },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Aggregation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aggregated jobs', details: error.message },
      { status: 500 }
    );
  }
}