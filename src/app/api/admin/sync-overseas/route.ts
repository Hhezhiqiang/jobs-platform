import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncOverseasJobs } from '@/lib/sync-overseas-jobs';

export const dynamic = "force-dynamic";
