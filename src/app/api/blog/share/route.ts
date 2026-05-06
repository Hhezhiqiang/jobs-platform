import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { shareToTwitter, shareToLinkedIn, generateShareContent } from "@/lib/social-share";
import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

/**
 * POST /api/blog/share
 * 分享博客到社交媒体
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { blogId, platforms = ["twitter", "linkedin"] } = await request.json();
    
    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    // 生成分享内容
    const content = await generateShareContent(blogId, SITE_URL);
    if (!content) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // 分享到各平台
    const results: Record<string, any> = {};

    if (platforms.includes("twitter")) {
      results.twitter = await shareToTwitter(content);
    }

    if (platforms.includes("linkedin")) {
      results.linkedin = await shareToLinkedIn(content);
    }

    return NextResponse.json({
      success: true,
      results,
      content: {
        title: content.title,
        url: content.url,
      },
    });
  } catch (error) {
    logger.error("[API] Blog share error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
