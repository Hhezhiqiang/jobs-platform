export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (per-instance). Clear on deploy.
const RATE_LIMIT = new Map<string, RateLimitEntry>();
const LIMIT = 20;       // requests per window
const WINDOW_MS = 60000; // 1 minute

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const post = await prisma.pages.update({
      where: { slug, type: "BLOG", status: "PUBLISHED" },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: post.viewCount });
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
