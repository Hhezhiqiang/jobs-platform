import type { Metadata } from 'next';
import AggregatedJobsClient from './aggregated-jobs-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Web3 Job Radar - JobQuip' : 'Web3 全网雷达 - JobQuip',
    description: isEn 
      ? 'AI agent continuously scans Web3/blockchain jobs across the internet'
      : 'AI Agent 持续扫描全网 Web3/区块链岗位，帮你发现散落在各个平台的机会',
  };
}

export default function AggregatedJobsPage() {
  return <AggregatedJobsClient />;
}