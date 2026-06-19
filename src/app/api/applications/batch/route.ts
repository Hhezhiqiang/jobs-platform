import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { jobIds, coverLetter, email, name } = body;
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) return NextResponse.json({ error: "璇烽€夋嫨鑷冲皯涓€涓矖浣? }, { status: 400 });
    const userId = session?.user?.id || null;
    const isGuest = !userId;
    if (isGuest && !email) return NextResponse.json({ error: "璇峰～鍐欓偖绠? }, { status: 400 });
    let success = 0, skipped = 0;
    for (const jobId of jobIds) {
      try {
        const existing = await prisma.job_applications.findFirst({ where: { jobId, OR: [{ userId: userId || undefined }, ...(isGuest ? [{ guestEmail: email }] : [])] } });
        if (existing) { skipped++; continue; }
        await prisma.job_applications.create({ data: { jobId, userId: userId || undefined, guestEmail: isGuest ? email : undefined, guestName: isGuest ? name || undefined : undefined, coverLetter: coverLetter || undefined, status: "PENDING" } });
        success++;
      } catch (e) { skipped++; }
    }
    return NextResponse.json({ success: true, applied: success, skipped, total: jobIds.length, message: "宸茬敵璇?" + success + " 涓矖浣? });
  } catch (error) { return NextResponse.json({ error: "鎵归噺鐢宠澶辫触" }, { status: 500 }); }
}