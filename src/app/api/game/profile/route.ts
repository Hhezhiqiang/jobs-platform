export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGameProfile, trackLogin } from "@/lib/game/exp-system";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const profile = await getGameProfile(session.user.id);
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error("获取游戏档案失败:", error);
    return NextResponse.json(
      { error: "获取游戏档案失败" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 记录登录
    await trackLogin(session.user.id);
    
    const profile = await getGameProfile(session.user.id);
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error("更新登录状态失败:", error);
    return NextResponse.json(
      { error: "更新登录状态失败" },
      { status: 500 }
    );
  }
}
