import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/messages — list current viewer's conversations
// Auto-detects side by session.user.role / company_members membership.
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const userId = session.user.id;

    // Find recruiter membership (if any)
    const membership = await prisma.company_members.findFirst({
      where: { userId },
      select: { companyId: true, role: true },
    });

    const side: "USER" | "COMPANY" = membership ? "COMPANY" : "USER";

    const where = side === "COMPANY"
      ? { companyId: membership!.companyId }
      : { userId };

    const conversations = await prisma.conversations.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        users: { select: { id: true, name: true, email: true, avatar: true } },
        companies: { select: { id: true, name: true, logo: true, slug: true } },
        jobs: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ side, conversations });
  } catch (error) {
    logger.error("List conversations error:", error);
    return NextResponse.json({ error: "获取会话失败" }, { status: 500 });
  }
}

// POST /api/messages — open or fetch a conversation, optionally tied to a job.
// body: { companyId: string; jobId?: string; userId?: string (only allowed for company side) }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = await req.json();
    const { companyId, jobId, userId: targetUserId } = body || {};

    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ error: "缺少 companyId" }, { status: 400 });
    }

    // Determine the candidate side userId
    const recruiterMembership = await prisma.company_members.findFirst({
      where: { userId: session.user.id, companyId },
      select: { companyId: true },
    });

    let userId: string;
    if (recruiterMembership) {
      // Company side opening a thread with a specific candidate
      if (!targetUserId || typeof targetUserId !== "string") {
        return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
      }
      userId = targetUserId;
    } else {
      // Candidate side opening a thread with a company
      userId = session.user.id;
    }

    const jobIdKey = jobId || null;

    const conversation = await prisma.conversations.upsert({
      where: {
        userId_companyId_jobId: {
          userId,
          companyId,
          jobId: jobIdKey as any,
        },
      },
      create: {
        userId,
        companyId,
        jobId: jobIdKey,
      },
      update: {},
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    logger.error("Open conversation error:", error);
    return NextResponse.json({ error: "无法打开会话" }, { status: 500 });
  }
}
