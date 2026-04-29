import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await request.json();
  await prisma.users.update({
    where: { id: session.user.id },
    data: {
      notificationEmail: settings.email ?? false,
      notificationSms: settings.sms ?? false,
      notificationPush: settings.push ?? false,
    },
  });

  return NextResponse.json({ message: "设置已保存" });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { notificationEmail: true, notificationSms: true, notificationPush: true },
  });

  return NextResponse.json({
    email: user?.notificationEmail ?? true,
    sms: user?.notificationSms ?? false,
    push: user?.notificationPush ?? false,
  });
}
