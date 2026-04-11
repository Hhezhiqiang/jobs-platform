import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // 原子更新浏览量
    const post = await prisma.page.update({
      where: { slug, type: "BLOG", status: "PUBLISHED" },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: post.viewCount });
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
