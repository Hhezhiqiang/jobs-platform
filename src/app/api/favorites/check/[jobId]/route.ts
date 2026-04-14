import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// 检查职位是否已收藏
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false });
    }

    const { jobId } = params;

    const favorite = await prisma.favorites.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("检查收藏状态失败:", error);
    return NextResponse.json({ isFavorited: false });
  }
}
