import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 删除用户相关数据
  await prisma.$transaction([
    prisma.job_applications.deleteMany({ where: { userId: session.user.id } }),
    prisma.resumes.deleteMany({ where: { userId: session.user.id } }),
    prisma.favorites.deleteMany({ where: { userId: session.user.id } }),
    prisma.users.delete({ where: { id: session.user.id } }),
  ]);

  return NextResponse.json({ message: "账户已删除" });
}
