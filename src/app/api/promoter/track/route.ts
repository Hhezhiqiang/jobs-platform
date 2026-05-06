export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

// GET /api/promoter/track?code=ABC123&redirect=/jobs
// 记录点击并跳转到落地页
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (!code) {
    return NextResponse.json({ success: false, error: "缺少 code 参数" }, { status: 400 });
  }

  try {
    const link = await prisma.promoter_links.findUnique({
      where: { code },
      include: { promoters: true },
    });

    if (!link) {
      return NextResponse.json({ success: false, error: "推广链接不存在" }, { status: 404 });
    }

    if (link.status === "PAUSED") {
      return NextResponse.json({ success: false, error: "推广链接已暂停" }, { status: 403 });
    }

    // 记录点击
    await prisma.promoter_links.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    // 跳转到落地页（携带 ref 参数）
    const separator = redirect.includes("?") ? "&" : "?";
    const url = `${redirect}${separator}ref=${code}`;
    return NextResponse.redirect(new URL(url, request.url), 302);
  } catch (error) {
    logger.error("[promoter/track] error:", error);
    return NextResponse.redirect(new URL(redirect, request.url), 302);
  }
}
