import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function getViewerContext(userId: string) {
  const membership = await prisma.company_members.findFirst({
    where: { userId },
    select: { companyId: true },
  });
  return { userId, companyId: membership?.companyId || null };
}

// GET /api/messages/[id] — fetch a conversation thread, mark read for viewer side.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const viewer = await getViewerContext(session.user.id);

    const conversation = await prisma.conversations.findUnique({
      where: { id: params.id },
      include: {
        users: { select: { id: true, name: true, email: true, avatar: true } },
        companies: { select: { id: true, name: true, logo: true, slug: true } },
        jobs: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

    const isCandidate = conversation.userId === viewer.userId;
    const isRecruiter = viewer.companyId === conversation.companyId;
    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const messages = await prisma.messages.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    // Mark viewer's side as read.
    if (isCandidate && conversation.unreadByUser > 0) {
      await prisma.conversations.update({
        where: { id: conversation.id },
        data: { unreadByUser: 0 },
      });
    } else if (isRecruiter && conversation.unreadByCompany > 0) {
      await prisma.conversations.update({
        where: { id: conversation.id },
        data: { unreadByCompany: 0 },
      });
    }

    return NextResponse.json({
      conversation,
      messages,
      viewer: { side: isRecruiter ? "COMPANY" : "USER" },
    });
  } catch (error) {
    logger.error("Get conversation error:", error);
    return NextResponse.json({ error: "获取会话失败" }, { status: 500 });
  }
}

// POST /api/messages/[id] — send a message in this conversation.
// body: { body: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const viewer = await getViewerContext(session.user.id);
    const body = await req.json();
    const text = (body?.body || "").toString().trim();
    if (!text) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: "消息过长" }, { status: 400 });
    }

    const conversation = await prisma.conversations.findUnique({
      where: { id: params.id },
      include: {
        companies: { select: { name: true } },
        users: { select: { name: true } },
        jobs: { select: { title: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

    const isCandidate = conversation.userId === viewer.userId;
    const isRecruiter = viewer.companyId === conversation.companyId;
    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const senderType: "USER" | "COMPANY" = isRecruiter ? "COMPANY" : "USER";

    const message = await prisma.messages.create({
      data: {
        conversationId: conversation.id,
        senderType,
        senderUserId: session.user.id,
        body: text,
      },
    });

    await prisma.conversations.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: text.slice(0, 200),
        unreadByUser: senderType === "COMPANY" ? { increment: 1 } : 0,
        unreadByCompany: senderType === "USER" ? { increment: 1 } : 0,
      },
    });

    // Mirror as a notification to the receiving side (candidate only; recruiters use inbox).
    if (senderType === "COMPANY") {
      try {
        await prisma.notifications.create({
          data: {
            id: crypto.randomUUID(),
            userId: conversation.userId,
            type: "INTERVIEW_INVITE",
            title: `${conversation.companies?.name || "企业"} 给您发了消息`,
            content: text.slice(0, 200),
            metadata: {
              conversationId: conversation.id,
              jobId: conversation.jobId,
            } as any,
          },
        });
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error("Send message error:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
